// The course library shown before the dashboard. Only "Inside the Black Box" has lessons today;
// the rest are listed so designers can see where the path goes next.

export interface Credit {
  /** Shown under the image, e.g. "Lakeworks · CC BY-SA 3.0 · Wikimedia Commons". */
  text: string
  /** Where the image came from. */
  href: string
}

export interface CourseImage {
  src: string
  alt: string
  credit: Credit
}

export interface Course {
  id: string
  title: string
  blurb: string
  icon: string
  status: 'active' | 'soon' | 'capstone'
  image?: CourseImage
}

export const IMAGES = {
  neuralNetwork: {
    src: 'assets/images/neural-network.jpg',
    alt: 'Diagram of a neural network: input, hidden and output layers of circles joined by lines.',
    credit: {
      text: 'Glosser.ca · CC BY-SA 3.0 · Wikimedia Commons',
      href: 'https://commons.wikimedia.org/wiki/File:Colored_neural_network.svg',
    },
  },
  matrix: {
    src: 'assets/images/matrix-multiplication.jpg',
    alt: 'Matrix multiplication: a row of matrix A and a column of matrix B combine into one cell of the result.',
    credit: {
      text: 'Lakeworks · CC BY-SA 3.0 · Wikimedia Commons',
      href: 'https://commons.wikimedia.org/wiki/File:Matrix_multiplication_diagram_2.svg',
    },
  },
  embedding: {
    src: 'assets/images/word-embedding.jpg',
    alt: 'Word embedding: arrows from France to Paris and from Germany to Berlin point the same way.',
    credit: {
      text: 'Fschwarzentruber · CC BY-SA 4.0 · Wikimedia Commons',
      href: 'https://commons.wikimedia.org/wiki/File:Word_embedding_illustration.svg',
    },
  },
  features: {
    src: 'assets/images/feature-visualization.jpg',
    alt: 'Feature visualizations: dreamlike images showing what individual neurons in a vision model respond to.',
    credit: {
      text: 'Olah, Mordvintsev & Schubert · Distill · CC BY 4.0',
      href: 'https://distill.pub/2017/feature-visualization/',
    },
  },
} satisfies Record<string, CourseImage>

export const BLACK_BOX_ID = 'black-box'

export const COURSES: Course[] = [
  {
    id: BLACK_BOX_ID,
    title: 'Inside the Black Box',
    blurb: 'The language of AI, one card a day.',
    icon: 'assets/icons/box.png',
    status: 'active',
  },
  { id: 'tokens', title: 'Tokens & Text', blurb: 'How a model reads a sentence', icon: 'assets/icons/tokens.png', status: 'soon' },
  {
    id: 'matrices',
    title: 'Matrices & Vectors',
    blurb: 'The math behind meaning',
    icon: 'assets/icons/matrix.png',
    status: 'soon',
    image: IMAGES.matrix,
  },
  {
    id: 'neural',
    title: 'Neural Networks',
    blurb: 'Layers, weights and learning',
    icon: 'assets/icons/neural.png',
    status: 'soon',
    image: IMAGES.neuralNetwork,
  },
  {
    id: 'safety',
    title: 'AI Safety',
    blurb: 'Alignment, red teams, guardrails',
    icon: 'assets/icons/shield.png',
    status: 'soon',
    image: IMAGES.features,
  },
  { id: 'probability', title: 'Probability', blurb: 'Why one prompt gives many answers', icon: 'assets/icons/dice.png', status: 'soon' },
  { id: 'binary', title: 'Binary & Data', blurb: 'How computers store everything', icon: 'assets/icons/binary.png', status: 'soon' },
  { id: 'algorithms', title: 'Algorithms', blurb: 'Step-by-step logic, like a recipe', icon: 'assets/icons/flow.png', status: 'soon' },
  { id: 'tiny-model', title: 'Build a Tiny Model', blurb: 'Capstone: put it all together', icon: 'assets/icons/lock.png', status: 'capstone' },
]

/** A picture that helps with a unit of Inside the Black Box, shown on the dashboard. */
export const UNIT_IMAGES: Record<string, CourseImage> = {
  basics: IMAGES.neuralNetwork,
  inside: IMAGES.embedding,
  safety: IMAGES.features,
}
