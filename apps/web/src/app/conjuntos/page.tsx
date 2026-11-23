import HomePage from '../page';

export const metadata = {
  title: 'Conjuntos Fitness Femininos | Promoção Leve 3 por $110 | ANA FITNESS WEAR',
  description: 'Explore nossa coleção exclusiva de conjuntos fitness femininos de alta compressão e zero transparência. Promoção especial: Leve 3 Conjuntos por apenas $110!',
};

export default function ConjuntosRoute() {
  return <HomePage initialCategory="sets" />;
}
