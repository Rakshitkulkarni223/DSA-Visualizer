"""The Phase 1 example library, served by GET /api/examples."""
from __future__ import annotations

TWO_SUM_CODE = """class Solution:
    def twoSum(self, nums, target):
        left = 0
        right = len(nums) - 1
        while left < right:
            total = nums[left] + nums[right]
            if total == target:
                return [left, right]
            if total < target:
                left += 1
            else:
                right -= 1
        return []
"""

BINARY_SEARCH_CODE = """def binary_search(nums, target):
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1
"""

SLIDING_WINDOW_CODE = """def max_sum_subarray(nums, k):
    max_sum = 0
    window_sum = 0
    for i in range(len(nums)):
        window_sum += nums[i]
        if i >= k - 1:
            max_sum = max(max_sum, window_sum)
            window_sum -= nums[i - k + 1]
    return max_sum
"""

FACTORIAL_CODE = """def factorial(n):
    return 1 if n <= 1 else n * factorial(n - 1)
"""

EXAMPLES = [
    {
        "id": "two-sum",
        "title": "Two Sum",
        "category": "array-two-pointer",
        "code": TWO_SUM_CODE,
        "input": {"nums": [2, 7, 11, 15], "target": 9},
        "expectedOutput": [0, 1],
    },
    {
        "id": "binary-search",
        "title": "Binary Search",
        "category": "array",
        "code": BINARY_SEARCH_CODE,
        "input": {"nums": [1, 3, 5, 7, 9, 11], "target": 7},
        "expectedOutput": 3,
    },
    {
        "id": "sliding-window-max-sum",
        "title": "Sliding Window Max Sum",
        "category": "array-window",
        "code": SLIDING_WINDOW_CODE,
        "input": {"nums": [2, 1, 5, 1, 3, 2], "k": 3},
        "expectedOutput": 9,
    },
    {
        "id": "factorial-recursion",
        "title": "Factorial (Recursion)",
        "category": "recursion",
        "code": FACTORIAL_CODE,
        "input": {"n": 5},
        "expectedOutput": 120,
    },
]
