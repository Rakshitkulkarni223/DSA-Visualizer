// Dev-only fixture: a full VisualizeResponse for the Two Sum example,
// matching CONTRACT.md's StepSnapshot/response shape exactly, used to
// render the whole app without a running backend (see App.tsx's `?fixture=1`
// escape hatch). NOT used on the real request path.

import type { JsonObject, StepSnapshot, VisualizeSuccessResponse } from '../../types/schema'

export const twoSumFixtureCode = `def two_sum(nums, target):
    left = 0
    right = len(nums) - 1
    while left < right:
        total = nums[left] + nums[right]
        if total == target:
            return [left, right]
        elif total < target:
            left += 1
        else:
            right -= 1
    return []
`

export const twoSumFixtureInput: JsonObject = {
  nums: [2, 7, 11, 15],
  target: 9,
}

export const twoSumFixtureExpectedOutput = [0, 1]

const steps: StepSnapshot[] = [
  {
    step: 0,
    line: 2,
    event: 'call',
    functionName: 'two_sum',
    variables: { nums: [2, 7, 11, 15], target: 9 },
    callStack: [{ function: 'two_sum', line: 2, locals: { nums: [2, 7, 11, 15], target: 9 } }],
    structures: [
      {
        id: 'nums',
        type: 'array',
        values: [2, 7, 11, 15],
        pointers: {},
        highlights: { current: [], visited: [], active: [] },
        window: null,
      },
    ],
    operation: null,
    explanation: 'Entering two_sum with nums=[2, 7, 11, 15], target=9.',
    returnValue: null,
  },
  {
    step: 1,
    line: 3,
    event: 'line',
    functionName: 'two_sum',
    variables: { nums: [2, 7, 11, 15], target: 9, left: 0 },
    callStack: [
      { function: 'two_sum', line: 3, locals: { nums: [2, 7, 11, 15], target: 9, left: 0 } },
    ],
    structures: [
      {
        id: 'nums',
        type: 'array',
        values: [2, 7, 11, 15],
        pointers: { left: 0 },
        highlights: { current: [0], visited: [], active: [0] },
        window: null,
      },
    ],
    operation: null,
    explanation: 'Initialize left pointer at index 0.',
    returnValue: null,
  },
  {
    step: 2,
    line: 4,
    event: 'line',
    functionName: 'two_sum',
    variables: { nums: [2, 7, 11, 15], target: 9, left: 0, right: 3 },
    callStack: [
      {
        function: 'two_sum',
        line: 4,
        locals: { nums: [2, 7, 11, 15], target: 9, left: 0, right: 3 },
      },
    ],
    structures: [
      {
        id: 'nums',
        type: 'array',
        values: [2, 7, 11, 15],
        pointers: { left: 0, right: 3 },
        highlights: { current: [0, 3], visited: [], active: [0, 3] },
        window: null,
      },
    ],
    operation: null,
    explanation: 'Initialize right pointer at index 3 (end of array).',
    returnValue: null,
  },
  {
    step: 3,
    line: 6,
    event: 'line',
    functionName: 'two_sum',
    variables: { nums: [2, 7, 11, 15], target: 9, left: 0, right: 3, total: 17 },
    callStack: [
      {
        function: 'two_sum',
        line: 6,
        locals: { nums: [2, 7, 11, 15], target: 9, left: 0, right: 3, total: 17 },
      },
    ],
    structures: [
      {
        id: 'nums',
        type: 'array',
        values: [2, 7, 11, 15],
        pointers: { left: 0, right: 3 },
        highlights: { current: [], visited: [], active: [0, 3] },
        window: null,
      },
    ],
    operation: { type: 'compare', description: 'nums[left] + nums[right] = 2 + 15 = 17' },
    explanation: 'Check nums[0] + nums[3] = 17 against target 9.',
    returnValue: null,
  },
  {
    step: 4,
    line: 10,
    event: 'line',
    functionName: 'two_sum',
    variables: { nums: [2, 7, 11, 15], target: 9, left: 0, right: 2, total: 17 },
    callStack: [
      {
        function: 'two_sum',
        line: 10,
        locals: { nums: [2, 7, 11, 15], target: 9, left: 0, right: 2, total: 17 },
      },
    ],
    structures: [
      {
        id: 'nums',
        type: 'array',
        values: [2, 7, 11, 15],
        pointers: { left: 0, right: 2 },
        highlights: { current: [], visited: [3], active: [0, 2] },
        window: null,
      },
    ],
    operation: { type: 'pointer_move', description: 'total > target, decrement right pointer' },
    explanation: '17 > 9, so decrement the right pointer to narrow the search from the high side.',
    returnValue: null,
  },
  {
    step: 5,
    line: 6,
    event: 'line',
    functionName: 'two_sum',
    variables: { nums: [2, 7, 11, 15], target: 9, left: 0, right: 2, total: 13 },
    callStack: [
      {
        function: 'two_sum',
        line: 6,
        locals: { nums: [2, 7, 11, 15], target: 9, left: 0, right: 2, total: 13 },
      },
    ],
    structures: [
      {
        id: 'nums',
        type: 'array',
        values: [2, 7, 11, 15],
        pointers: { left: 0, right: 2 },
        highlights: { current: [], visited: [3], active: [0, 2] },
        window: null,
      },
    ],
    operation: { type: 'compare', description: 'nums[left] + nums[right] = 2 + 11 = 13' },
    explanation: 'Check nums[0] + nums[2] = 13 against target 9.',
    returnValue: null,
  },
  {
    step: 6,
    line: 10,
    event: 'line',
    functionName: 'two_sum',
    variables: { nums: [2, 7, 11, 15], target: 9, left: 0, right: 1, total: 13 },
    callStack: [
      {
        function: 'two_sum',
        line: 10,
        locals: { nums: [2, 7, 11, 15], target: 9, left: 0, right: 1, total: 13 },
      },
    ],
    structures: [
      {
        id: 'nums',
        type: 'array',
        values: [2, 7, 11, 15],
        pointers: { left: 0, right: 1 },
        highlights: { current: [], visited: [3, 2], active: [0, 1] },
        window: null,
      },
    ],
    operation: { type: 'pointer_move', description: 'total > target, decrement right pointer' },
    explanation: '13 > 9, so decrement the right pointer again to index 1.',
    returnValue: null,
  },
  {
    step: 7,
    line: 6,
    event: 'line',
    functionName: 'two_sum',
    variables: { nums: [2, 7, 11, 15], target: 9, left: 0, right: 1, total: 9 },
    callStack: [
      {
        function: 'two_sum',
        line: 6,
        locals: { nums: [2, 7, 11, 15], target: 9, left: 0, right: 1, total: 9 },
      },
    ],
    structures: [
      {
        id: 'nums',
        type: 'array',
        values: [2, 7, 11, 15],
        pointers: { left: 0, right: 1 },
        highlights: { current: [0, 1], visited: [3, 2], active: [0, 1] },
        window: null,
      },
    ],
    operation: { type: 'compare', description: 'nums[left] + nums[right] = 2 + 7 = 9' },
    explanation: 'Check nums[0] + nums[1] = 9 against target 9 - it matches!',
    returnValue: null,
  },
  {
    step: 8,
    line: 7,
    event: 'return',
    functionName: 'two_sum',
    variables: { nums: [2, 7, 11, 15], target: 9, left: 0, right: 1, total: 9 },
    callStack: [],
    structures: [
      {
        id: 'nums',
        type: 'array',
        values: [2, 7, 11, 15],
        pointers: { left: 0, right: 1 },
        highlights: { current: [0, 1], visited: [3, 2], active: [0, 1] },
        window: null,
      },
    ],
    operation: null,
    explanation: 'Found a matching pair! Returning indices [0, 1].',
    returnValue: [0, 1],
  },
]

export const twoSumFixtureResponse: VisualizeSuccessResponse = {
  status: 'success',
  output: [0, 1],
  expectedOutput: [0, 1],
  outputMatches: true,
  detected: [
    { type: 'array', confidence: 0.98 },
    { type: 'two_pointer', confidence: 0.91 },
  ],
  complexity: {
    time: 'O(n)',
    space: 'O(1)',
    explanation:
      'The two pointers each move inward at most n times total across the loop, and no extra data structures scale with input size.',
    estimated: true,
  },
  steps,
  truncated: false,
  maxSteps: 10000,
}
