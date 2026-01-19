import { createReasoningTools, type Toolkit } from "@voltagent/core";

// Basic usage - includes both tools and adds instructions/examples
const reasoningToolkit: Toolkit = createReasoningTools();

// Customized usage - e.g., only include 'think' and don't add instructions
const thinkOnlyToolkit: Toolkit = createReasoningTools({
  analyze: false,
  addInstructions: false,
  think: true,
  addFewShot: false,
//  fewShotExamples: 'This is a custom example.',
});

const fullReasoningToolkit: Toolkit = createReasoningTools({
  analyze: true,
  addInstructions: true,
  think: true,
  addFewShot: false,
  fewShotExamples: 'This is a custom example.',
});

const fewShotToolkit: Toolkit = createReasoningTools({
  analyze: true,
  addInstructions: true,
  think: true,
  addFewShot: true,
//  fewShotExamples: 'This is a custom example.',
});
export { reasoningToolkit, thinkOnlyToolkit, fullReasoningToolkit, fewShotToolkit };
