---
created: 2025-12-11T13:54
updated: 2025-12-11T13:56
tags:
  - java
---
# Java vs Python: Memory Model for Nodes
**Tags:** #java #python #systems #memory #dsa

### The Core Difference: Primitives vs References

**1. Python `Node.val`:**
*   When you do `self.val = some_value` (e.g., `Node(5)`), the `5` is an `int` object created on the heap (or an interned, pre-existing `int` object).
*   The `val` attribute inside your `Node` object on the heap will hold a **reference** to that `int` object `5`.
*   So, in Python, to get to the actual value `5`, you always follow a chain: `variable` (stack reference) -> `Node object` (heap) -> `val attribute` (heap reference) -> `int object 5` (heap).

**2. Java `Node.val`:**
This depends on whether `val` is declared as a **primitive type** or an **object type** in Java.

*   **If `val` is a primitive (e.g., `int val;`):**
    *   When you create `new Node(5)`, the `Node` object is on the heap.
    *   The actual *value* `5` for the `val` attribute is stored directly *inside* the `Node` object's memory block on the heap. There's no separate `Integer` object on the heap, and no extra reference to follow.
    *   Chain: `variable` (stack reference) -> `Node object` (heap, contains `val=5` directly).

*   **If `val` is an object (e.g., `Object val;` or `String val;`):**
    *   When you create `new Node("hello")`, the `Node` object is on the heap. The `"hello"` string is *also* an object on the heap.
    *   The `val` attribute inside the `Node` object on the heap will hold a **reference** to the `"hello"` string object on the heap.
    *   Chain: `variable` (stack reference) -> `Node object` (heap) -> `val attribute` (heap reference) -> `String object "hello"` (heap).