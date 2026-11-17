// Pictures and "Go deeper" articles for the flashcards.
// Images must be openly licensed (the plugin is public). Articles can be any reputable source.

export interface Credit {
  /** Shown under the image, e.g. "Lakeworks · CC BY-SA 3.0 · Wikimedia Commons". */
  text: string
  /** Where the image came from. Leave out for diagrams made for this plugin. */
  href?: string
}

export interface CardImage {
  src: string
  alt: string
  credit: Credit
}

export interface Article {
  title: string
  source: string
  href: string
}

const commons = (file: string) => `https://commons.wikimedia.org/wiki/File:${file}`
const ORIGINAL: Credit = { text: 'Inside the Black Box · original diagram' }

export const IMAGES = {
  aiMlDl: {
    src: 'assets/images/ai-ml-dl.jpg',
    alt: 'Nested circles: generative AI inside deep learning, inside machine learning, inside artificial intelligence.',
    credit: {
      text: 'Lily Popova Zhuhadar · CC BY-SA 4.0 · Wikimedia Commons',
      href: commons('Unraveling_AI_Complexity_-_A_Comparative_View_of_AI,_Machine_Learning,_Deep_Learning,_and_Generative_AI.png'),
    },
  },
  neuralNetwork: {
    src: 'assets/images/neural-network.jpg',
    alt: 'Diagram of a neural network: input, hidden and output layers of circles joined by arrows.',
    credit: { text: 'Glosser.ca · CC BY-SA 3.0 · Wikimedia Commons', href: commons('Colored_neural_network.svg') },
  },
  matrix: {
    src: 'assets/images/matrix-multiplication.jpg',
    alt: 'Matrix multiplication: a row of matrix A and a column of matrix B combine into one cell of the result.',
    credit: { text: 'Lakeworks · CC BY-SA 3.0 · Wikimedia Commons', href: commons('Matrix_multiplication_diagram_2.svg') },
  },
  generativeAi: {
    src: 'assets/images/generative-ai.jpg',
    alt: 'Théâtre D’opéra Spatial: an AI-generated painting of robed figures in a vast, glowing hall.',
    credit: { text: 'Jason M. Allen via Midjourney · Public domain · Wikimedia Commons', href: commons('Théâtre_D’opéra_Spatial.png') },
  },
  token: {
    src: 'assets/images/diagram-token.jpg',
    alt: 'The words "Unbelievable design" split into four numbered tokens: Un, believ, able, design.',
    credit: ORIGINAL,
  },
  nextToken: {
    src: 'assets/images/diagram-next-token.jpg',
    alt: 'After "The sky is", bars show the odds of the next word: blue 62%, clear 21%, grey 9%.',
    credit: ORIGINAL,
  },
  contextWindow: {
    src: 'assets/images/diagram-context-window.jpg',
    alt: 'A list of chat messages with a frame around the newest four; older messages above it are greyed out.',
    credit: ORIGINAL,
  },
  embedding: {
    src: 'assets/images/word-embedding.jpg',
    alt: 'Word embedding: arrows from France to Paris and from Germany to Berlin point the same way.',
    credit: { text: 'Fschwarzentruber · CC BY-SA 4.0 · Wikimedia Commons', href: commons('Word_embedding_illustration.svg') },
  },
  attention: {
    src: 'assets/images/attention.jpg',
    alt: 'Attention: a query is compared with keys in memory to decide which values feed the output.',
    credit: {
      text: 'Zhang, Lipton, Li & Smola (Dive into Deep Learning) · CC BY-SA 4.0 · Wikimedia Commons',
      href: commons('Attention_mechanism_overview.svg'),
    },
  },
  temperature: {
    src: 'assets/images/diagram-temperature.jpg',
    alt: 'Two bar charts: at low temperature one choice towers over the rest; at high temperature the odds are even.',
    credit: ORIGINAL,
  },
  rlhf: {
    src: 'assets/images/rlhf.jpg',
    alt: 'RLHF: people rank model answers, a reward model learns from the rankings and guides training.',
    credit: { text: 'PopoDameron · CC BY-SA 4.0 · Wikimedia Commons', href: commons('RLHF_diagram.svg') },
  },
  hallucination: {
    src: 'assets/images/diagram-hallucination.jpg',
    alt: 'An assistant confidently cites "Rivera et al. (2021)", tagged "Source not found".',
    credit: ORIGINAL,
  },
  promptInjection: {
    src: 'assets/images/prompt-injection.jpg',
    alt: 'Google Translate obeys an instruction hidden in the text to translate and writes code instead.',
    credit: { text: 'u/vk6_ · Public domain · Wikimedia Commons', href: commons('Google_Translate_prompt_injection.png') },
  },
  features: {
    src: 'assets/images/feature-visualization.jpg',
    alt: 'Feature visualizations: dreamlike images showing what individual neurons in a vision model respond to.',
    credit: { text: 'Olah, Mordvintsev & Schubert · Distill · CC BY 4.0', href: 'https://distill.pub/2017/feature-visualization/' },
  },
  humanInTheLoop: {
    src: 'assets/images/diagram-human-in-the-loop.jpg',
    alt: 'AI drafts an email, a person reviews it, and it is sent only once approved.',
    credit: ORIGINAL,
  },
} satisfies Record<string, CardImage>

/** Pictures on the front of a flashcard, by card id. */
export const CARD_IMAGES: Record<string, CardImage> = {
  ai: IMAGES.aiMlDl,
  'neural-network': IMAGES.neuralNetwork,
  parameters: IMAGES.matrix,
  'generative-ai': IMAGES.generativeAi,
  token: IMAGES.token,
  'next-token': IMAGES.nextToken,
  'context-window': IMAGES.contextWindow,
  embedding: IMAGES.embedding,
  attention: IMAGES.attention,
  temperature: IMAGES.temperature,
  rlhf: IMAGES.rlhf,
  'reward-model': IMAGES.rlhf,
  hallucination: IMAGES.hallucination,
  'prompt-injection': IMAGES.promptInjection,
  interpretability: IMAGES.features,
  features: IMAGES.features,
  'human-in-the-loop': IMAGES.humanInTheLoop,
  // AI in Practice
  'p-context': IMAGES.contextWindow,
  'p-temperature': IMAGES.temperature,
  'p-embedding': IMAGES.embedding,
  'p-rlhf': IMAGES.rlhf,
  'p-hallucination': IMAGES.hallucination,
  'p-injection': IMAGES.promptInjection,
  'p-interpretability': IMAGES.features,
  'p-hitl': IMAGES.humanInTheLoop,
}

const wiki = (page: string, title: string): Article => ({
  title,
  source: 'Wikipedia',
  href: `https://en.wikipedia.org/wiki/${page}`,
})
const PAIR = (chapter: string, title: string): Article => ({
  title,
  source: 'Google People + AI Guidebook',
  href: `https://pair.withgoogle.com/chapter/${chapter}/`,
})

/** A reputable article that goes deeper, by card id. Every Inside the Black Box term has one. */
export const ARTICLES: Record<string, Article> = {
  ai: wiki('Artificial_intelligence', 'Artificial intelligence'),
  ml: { title: 'What is machine learning?', source: 'Google for Developers', href: 'https://developers.google.com/machine-learning/intro-to-ml/what-is-ml' },
  'neural-network': wiki('Neural_network_(machine_learning)', 'Neural network (machine learning)'),
  parameters: { title: 'Machine learning glossary: parameter, weight', source: 'Google for Developers', href: 'https://developers.google.com/machine-learning/glossary' },
  model: { title: 'Machine learning glossary: model', source: 'Google for Developers', href: 'https://developers.google.com/machine-learning/glossary' },
  'training-data': wiki('Training,_validation,_and_test_data_sets', 'Training, validation and test data sets'),
  llm: wiki('Large_language_model', 'Large language model'),
  'generative-ai': wiki('Generative_artificial_intelligence', 'Generative artificial intelligence'),
  token: wiki('Byte-pair_encoding', 'Byte-pair encoding: how text becomes tokens'),
  'next-token': wiki('Language_model', 'Language model'),
  'context-window': { title: 'Context windows', source: 'Claude docs', href: 'https://platform.claude.com/docs/en/build-with-claude/context-windows' },
  embedding: { title: 'Embeddings', source: 'Google Machine Learning Crash Course', href: 'https://developers.google.com/machine-learning/crash-course/embeddings' },
  attention: { title: 'The Illustrated Transformer', source: 'Jay Alammar', href: 'https://jalammar.github.io/illustrated-transformer/' },
  prompt: { title: 'Prompt engineering overview', source: 'Claude docs', href: 'https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview' },
  inference: { title: 'Machine learning glossary: inference', source: 'Google for Developers', href: 'https://developers.google.com/machine-learning/glossary' },
  temperature: wiki('Softmax_function', 'Softmax function (see "temperature")'),
  pretraining: wiki('Generative_pre-trained_transformer', 'Generative pre-trained transformer'),
  'fine-tuning': wiki('Fine-tuning_(deep_learning)', 'Fine-tuning (deep learning)'),
  rlhf: { title: 'Illustrating Reinforcement Learning from Human Feedback', source: 'Hugging Face', href: 'https://huggingface.co/blog/rlhf' },
  'reward-model': wiki('Reinforcement_learning_from_human_feedback', 'Reinforcement learning from human feedback'),
  'constitutional-ai': { title: 'Constitutional AI: Harmlessness from AI Feedback', source: 'Anthropic', href: 'https://www.anthropic.com/research/constitutional-ai-harmlessness-from-ai-feedback' },
  'system-prompt': {
    title: 'Prompting best practices: give Claude a role',
    source: 'Claude docs',
    href: 'https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices#give-claude-a-role',
  },
  bias: wiki('Algorithmic_bias', 'Algorithmic bias'),
  hallucination: wiki('Hallucination_(artificial_intelligence)', 'Hallucination (artificial intelligence)'),
  sycophancy: { title: 'Towards Understanding Sycophancy in Language Models', source: 'Anthropic', href: 'https://www.anthropic.com/research/towards-understanding-sycophancy-in-language-models' },
  jailbreak: { title: 'Many-shot jailbreaking', source: 'Anthropic', href: 'https://www.anthropic.com/research/many-shot-jailbreaking' },
  'prompt-injection': { title: 'LLM01: Prompt Injection', source: 'OWASP GenAI Security Project', href: 'https://genai.owasp.org/llmrisk/llm01-prompt-injection/' },
  'reward-hacking': wiki('Reward_hacking', 'Reward hacking'),
  misuse: wiki('Deepfake', 'Deepfake'),
  'automation-bias': PAIR('explainability-trust', 'Explainability + Trust'),
  'ai-safety': wiki('AI_safety', 'AI safety'),
  alignment: wiki('AI_alignment', 'AI alignment'),
  interpretability: { title: 'Mapping the Mind of a Large Language Model', source: 'Anthropic', href: 'https://www.anthropic.com/research/mapping-mind-language-model' },
  features: { title: 'Zoom In: An Introduction to Circuits', source: 'Distill', href: 'https://distill.pub/2020/circuits/zoom-in/' },
  'red-teaming': wiki('Red_team', 'Red team'),
  evals: { title: 'Challenges in evaluating AI systems', source: 'Anthropic', href: 'https://www.anthropic.com/research/evaluating-ai-systems' },
  guardrails: PAIR('errors-failing', 'Errors + Graceful Failure'),
  'human-in-the-loop': PAIR('feedback-controls', 'Feedback + Control'),
  'model-card': { title: 'Model Cards for Model Reporting', source: 'Mitchell et al., arXiv', href: 'https://arxiv.org/abs/1810.03993' },
  'responsible-scaling': { title: "Anthropic's Responsible Scaling Policy", source: 'Anthropic', href: 'https://www.anthropic.com/news/anthropics-responsible-scaling-policy' },
}
