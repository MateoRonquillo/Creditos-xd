[CmdletBinding()]
param(
    [Parameter()]
    [string]$BackendPath = (Get-Location).Path,

    [Parameter()]
    [switch]$FoldersOnly,

    [Parameter()]
    [switch]$SkipRestore
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Assert-Command {
    param([string]$Name, [string]$InstallHint)
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "No se encontro '$Name'. $InstallHint"
    }
}

function Invoke-Checked {
    param([string]$Command, [string[]]$Arguments)
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "El comando '$Command $($Arguments -join ' ')' termino con codigo $LASTEXITCODE."
    }
}

function Ensure-Directory {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

function Write-TextFileIfMissing {
    param([string]$Path, [string]$Content)
    if (-not (Test-Path -LiteralPath $Path)) {
        Set-Content -LiteralPath $Path -Value $Content -Encoding utf8
    }
}

$BackendPath = [System.IO.Path]::GetFullPath($BackendPath)
$SolutionPath = Join-Path $BackendPath "SimuladorCreditos.Backend.sln"
$TestsPath = Join-Path $BackendPath "tests"

$Services = @(
    "ApiGateway",
    "AuthService",
    "CreditService",
    "SimulationService",
    "DocumentService"
)

Write-Step "Preparando backend en $BackendPath"
Ensure-Directory $BackendPath
Ensure-Directory $TestsPath

if (-not $FoldersOnly) {
    Assert-Command "dotnet" "Instala el SDK de .NET 10 y vuelve a ejecutar el script."

    if (-not (Test-Path -LiteralPath $SolutionPath)) {
        Write-Step "Creando la solucion de backend"
        Invoke-Checked "dotnet" @(
            "new", "sln",
            "--name", "SimuladorCreditos.Backend",
            "--output", $BackendPath,
            "--format", "sln"
        )
    }

    Write-Step "Creando microservicios Web API"
    foreach ($Service in $Services) {
        $ServicePath = Join-Path $BackendPath $Service
        $ProjectFile = Join-Path $ServicePath "$Service.csproj"

        if (-not (Test-Path -LiteralPath $ProjectFile)) {
            $TemplateArguments = @(
                "new", "webapi",
                "--name", $Service,
                "--output", $ServicePath,
                "--framework", "net10.0",
                "--use-controllers",
                "--no-https"
            )
            if ($SkipRestore) {
                $TemplateArguments += "--no-restore"
            }
            Invoke-Checked "dotnet" $TemplateArguments
        }

        Invoke-Checked "dotnet" @("sln", $SolutionPath, "add", $ProjectFile)
    }
}

Write-Step "Creando capas y carpetas internas"
foreach ($Service in $Services) {
    $ServicePath = Join-Path $BackendPath $Service
    Ensure-Directory $ServicePath

    foreach ($Folder in @("Application", "Domain", "Infrastructure")) {
        Ensure-Directory (Join-Path $ServicePath $Folder)
    }

    if ($Service -eq "ApiGateway") {
        Ensure-Directory (Join-Path $ServicePath "Configuration")
    }
    if ($Service -eq "AuthService") {
        Ensure-Directory (Join-Path $ServicePath "Security")
    }
    if ($Service -eq "SimulationService") {
        Ensure-Directory (Join-Path $ServicePath "Strategies")
    }
    if ($Service -eq "DocumentService") {
        Ensure-Directory (Join-Path $ServicePath "Templates")
        Ensure-Directory (Join-Path $ServicePath "Services")
    }

    $Dockerfile = @"
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["$Service.csproj", "./"]
RUN dotnet restore "$Service.csproj"
COPY . .
RUN dotnet publish "$Service.csproj" -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
EXPOSE 8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "$Service.dll"]
"@
    Write-TextFileIfMissing (Join-Path $ServicePath "Dockerfile") $Dockerfile

    $DockerIgnore = @'
bin/
obj/
.vs/
.vscode/
TestResults/
*.user
*.suo
'@
    Write-TextFileIfMissing (Join-Path $ServicePath ".dockerignore") $DockerIgnore
}

if (-not $FoldersOnly) {
    Write-Step "Creando proyectos de pruebas"
    foreach ($Service in @("AuthService", "CreditService", "SimulationService")) {
        $TestName = "$Service.Tests"
        $TestPath = Join-Path $TestsPath $TestName
        $TestProject = Join-Path $TestPath "$TestName.csproj"
        $ServiceProject = Join-Path (Join-Path $BackendPath $Service) "$Service.csproj"

        if (-not (Test-Path -LiteralPath $TestProject)) {
            $TestArguments = @(
                "new", "xunit",
                "--name", $TestName,
                "--output", $TestPath,
                "--framework", "net10.0"
            )
            if ($SkipRestore) {
                $TestArguments += "--no-restore"
            }
            Invoke-Checked "dotnet" $TestArguments
            Invoke-Checked "dotnet" @("add", $TestProject, "reference", $ServiceProject)
        }

        Invoke-Checked "dotnet" @("sln", $SolutionPath, "add", $TestProject)
    }

    if (-not $SkipRestore) {
        Write-Step "Restaurando y verificando la solucion"
        Invoke-Checked "dotnet" @("restore", $SolutionPath)
        Invoke-Checked "dotnet" @("build", $SolutionPath, "--no-restore")
    }
}

Write-Host "`nBackend creado correctamente:" -ForegroundColor Green
Write-Host $BackendPath
Write-Host "`nServicios incluidos:"
foreach ($Service in $Services) {
    Write-Host "  - $Service"
}

if ($FoldersOnly) {
    Write-Host "`nSe crearon solamente carpetas y archivos Docker."
}
elseif ($SkipRestore) {
    Write-Host "`nPara restaurar y compilar posteriormente:"
    Write-Host "  dotnet restore `"$SolutionPath`""
    Write-Host "  dotnet build `"$SolutionPath`" --no-restore"
}
else {
    Write-Host "`nLa solucion fue restaurada y compilada."
}

