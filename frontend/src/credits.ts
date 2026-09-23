export type CreditOption = {
  id: string;
  nombre: string;
  descripcion: string;
  interes: number;
  rango: string;
  plazoMaximo: string;
  imagen: string;
};

export const CREDIT_OPTIONS: CreditOption[] = [
  {
    id: 'consumo',
    nombre: 'Credito de consumo',
    descripcion: 'Para compras importantes, consolidacion de deudas o proyectos personales.',
    interes: 16.5,
    rango: 'Desde $300',
    plazoMaximo: 'Hasta 60 meses',
    imagen: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=900&auto=format&fit=crop',
  },
  {
    id: 'linea-abierta',
    nombre: 'Linea abierta',
    descripcion: 'Liquidez flexible para cubrir necesidades planificadas o imprevistas.',
    interes: 15.6,
    rango: 'Desde $500',
    plazoMaximo: 'Hasta 48 meses',
    imagen: 'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?q=80&w=900&auto=format&fit=crop',
  },
  {
    id: 'hipotecario',
    nombre: 'Credito hipotecario',
    descripcion: 'Financia vivienda nueva, usada o mejoras de tu hogar.',
    interes: 8.9,
    rango: 'Desde $5.000',
    plazoMaximo: 'Hasta 20 anos',
    imagen: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=900&auto=format&fit=crop',
  },
  {
    id: 'vivienda-vip',
    nombre: 'Vivienda de interes publico',
    descripcion: 'Una alternativa preferencial para adquirir tu primera vivienda.',
    interes: 4.87,
    rango: 'Segun avaluo',
    plazoMaximo: 'Hasta 25 anos',
    imagen: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=900&auto=format&fit=crop',
  },
  {
    id: 'educacion',
    nombre: 'Educacion superior',
    descripcion: 'Apoyo para matricula, colegiatura, manutencion o estudios de posgrado.',
    interes: 9.5,
    rango: 'Desde $1.000',
    plazoMaximo: 'Hasta 72 meses',
    imagen: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=900&auto=format&fit=crop',
  },
];
