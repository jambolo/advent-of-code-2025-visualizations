# **Instrumentation Prompt**

You must add production ready instrumentation to a Rust application so that it emits a strictly defined JSON log when execution finishes. All behavior must follow the project specific specification files.

## **Project specification files**

You must read and obey both documents exactly:

### `json_log_spec.md`

Defines the complete JSON schema, field names, nesting, types, formatting rules, and final output structure.
The final JSON log must conform exactly to this specification.

### `emission_rules.md`

Defines when and how instrumentation data must be collected, including timing rules, aggregation rules, and event semantics.
All instrumentation behavior must follow these rules precisely.

No new fields, semantics, or behaviors may be invented beyond these documents.

---

## **High level behavioral requirements**

1. The application must collect instrumentation data in memory throughout execution.
2. All instrumentation state must reside in a single central struct declared inside a dedicated `instrumentation` module.
3. A single instance of this struct is created and owned in the `main` function.
4. At program termination, this instance must be serialized to JSON using `serde_json` and written to stdout using `println!` as a single JSON object. When the `instrumented` feature is enabled, the program must output **only** the JSON data to stdout—no other text, headers, labels, or diagnostic messages may be printed.
5. When the `instrumented` feature is disabled:

   * No instrumentation code is compiled or executed.
   * No JSON log is printed.
   * Application behavior must remain unchanged.
6. Only code relevant to Part 2 of the application is instrumented.

---

## **Definition of Part 2 scope**

The application performs two operations on the same input and produces two distinct outcomes.
Any code not explicitly excluded from Part 2 is considered part of Part 2 and must be instrumented as required by the emission rules.

**Important:** Only Part 2 code is instrumented. When the `instrumented` feature is enabled, the `part2` feature must also be enabled. In `Cargo.toml`, define the feature as:

```toml
instrumented = ["part2", "serde", "serde_json"]
```

---

## **Coding and design constraints**

### **Core priorities (in order)**

1. **No local tracking variables.** This is the most important rule. Never introduce local variables in application code to track progress, counts, positions, or any other state for instrumentation purposes. All such state must reside inside the `Instrumentation` struct and be updated exclusively by calling its methods. Instrumentation variables are strictly forbidden in application code—they belong inside the `Instrumentation` struct.
2. **No code duplication.** Never duplicate existing functions or logic to add instrumentation. The same function must serve both instrumented and non-instrumented builds.
3. **No structural changes.** Preserve the original control flow, function signatures, and code organization. Add instrumentation calls inline, not by restructuring.

### **Minimal intrusion**

* Do not rename or restructure existing code unless strictly required.
* Do not alter public APIs unless absolutely necessary.
* Do not significantly modify comments.
* Do not create separate instrumented vs non-instrumented versions of functions. Use `#[cfg(feature = "instrumented")]` on individual statements within functions instead.

### **State isolation**

* All state variables used exclusively for instrumentation must reside inside the `Instrumentation` struct.
* State changes must occur only through methods implemented on the struct.
* Minimize instrumentation intrusion in the main application logic—keep call sites as simple as possible.
* Pass raw values to instrumentation methods; let the struct compute derived state internally.
* The `Instrumentation` struct should own any counters, accumulators, or collections needed for tracking. Application code should only call methods like `inst.record_removal(x, y)` or `inst.end_pass(&grid)`, never maintain its own `removed_this_pass` vector or `pass_number` counter.

### **Instrumentation module**

* A module named `instrumentation` must be placed at the **end of the existing Rust source file**. It must never be placed in a separate file.
* The module must contain:

  * A single output data struct representing the entire JSON output.
  * The single central data struct holding the state maintained by the instrumentation module as well as the JSON output struct.
  * All logic for collecting and updating instrumentation data.
  * A finalize and print function that outputs the JSON log.
* Only minimal helper functions and data structures may be publicly exposed.

### **Single output data struct**

* This struct must encode the exact JSON structure defined in `json_log_spec.md`.
* All state mutations must occur through helper functions in the instrumentation module.

### **Ownership model**

* The instance of the central instrumentation struct is created once in `main`.
* All other code interacts with this instance only through the helper functions provided by the instrumentation module.

### **Feature gating**

* All instrumentation code must be conditionally compiled using:

```rust
#[cfg(feature = "instrumented")]
```

* This gating applies to:

  * The instrumentation module
  * Any instrumentation fields added to existing structs
  * Any instrumentation function calls inserted into existing logic

* When the `instrumented` feature is disabled:

  * The application must compile without warnings
  * Runtime behavior must remain identical to the original program

### **Dependencies**

* Use only `serde_json` for JSON serialization.
* Emit the final JSON log using `println!`.
* Avoid all additional dependencies unless required by the specification documents.

---

## **Implementation instructions**

1. Inspect the project layout to identify:

   * The program entry point where the instrumentation struct instance will be created.
   * All Part 2 relevant modules and functions.

2. Translate `json_log_spec.md` into a Rust struct definition inside the instrumentation module that mirrors the JSON schema exactly.

3. Use `emission_rules.md` to determine every required event or update and where it occurs in the code.

4. Implement the instrumentation module:

   * Declare the central struct.
   * Implement functions for updating instrumentation state.
   * Implement the finalize and print function using `serde_json`.

5. Add minimal instrumentation calls inside Part 2 code paths. All must be gated with the `instrumented` feature.

   * Insert `#[cfg(feature = "instrumented")]` calls at key points within existing functions.
   * Do NOT duplicate functions. A function like `part2()` should have one definition with conditional instrumentation calls inside it.
   * Pass `&mut Instrumentation` as an additional parameter when `instrumented` is enabled. Use a macro or conditional compilation to handle the signature difference if needed.

6. Ensure the main function:

   * Creates the instrumentation state instance when instrumented.
   * Invokes the finalize and print function exactly once at program termination.

7. Validate:

   * With instrumentation enabled: JSON output must be correct and complete.
   * With instrumentation disabled: program behavior and build output must remain unchanged.

---

## **Hard constraints**

* No placeholder code or fabricated fields allowed.
* All behavior must derive solely from the two specification documents.
* Any ambiguity must be resolved through clarification before writing instrumentation code.

---

## **Anti-patterns to avoid**

The following patterns violate the core priorities and must not be used:

### ❌ Duplicating functions

```rust
// WRONG: Two separate function definitions
#[cfg(feature = "instrumented")]
fn part2(map: &[Vec<char>], inst: &mut Instrumentation) { ... }

#[cfg(not(feature = "instrumented"))]
fn part2(map: &[Vec<char>]) { ... }
```

### ❌ Adding local tracking variables (MOST CRITICAL VIOLATION)

This is the most common and serious anti-pattern. Any variable introduced solely to collect or track data for instrumentation violates the core design principle.

```rust
// WRONG: Local variables for instrumentation tracking
#[cfg(feature = "instrumented")]
let mut column_ranges: Vec<(usize, usize)> = Vec::new();
#[cfg(feature = "instrumented")]
let mut col_start: usize = 0;
#[cfg(feature = "instrumented")]
let mut col_end: Option<usize> = None;

for c in columns {
    // ... processing ...
    #[cfg(feature = "instrumented")]
    {
        if col_end.is_none() { col_end = Some(c); }
        col_start = c;
    }
}
#[cfg(feature = "instrumented")]
column_ranges.push((col_start, col_end.unwrap()));
inst.emit_problem(&column_ranges, ...);  // WRONG: passing local tracking data
```

```rust
// ALSO WRONG: Local collection for batch emission
let mut removed_this_pass = Vec::new();
for y in 0..height {
    for x in 0..width {
        if should_remove {
            removed_this_pass.push((x, y));
        }
    }
}
inst.emit_pass(&removed_this_pass);
```

**Why this is wrong:** The variables `column_ranges`, `col_start`, `col_end`, and `removed_this_pass` exist solely to serve instrumentation. They clutter application code with instrumentation concerns and violate the separation of responsibilities.

### ✅ Correct pattern

```rust
// RIGHT: Single function with inline conditional calls
fn part2(map: &[Vec<char>], #[cfg(feature = "instrumented")] inst: &mut Instrumentation) {
    #[cfg(feature = "instrumented")]
    inst.begin(&map);

    loop {
        #[cfg(feature = "instrumented")]
        inst.begin_pass();

        for y in 0..height {
            for x in 0..width {
                if should_remove {
                    new_map[y][x] = '.';
                    #[cfg(feature = "instrumented")]
                    inst.record_removal(x, y);
                }
            }
        }

        #[cfg(feature = "instrumented")]
        inst.end_pass(&new_map);

        if no_changes { break; }
    }

    #[cfg(feature = "instrumented")]
    inst.finalize(&new_map);
}
```

The `Instrumentation` struct internally tracks pass numbers, removal counts, and accumulates removed positions per pass.
