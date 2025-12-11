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
4. At program termination, this instance must be serialized to JSON using `serde_json` and written to stdout using `println!` as a single JSON object.
5. When the `instrumented` feature is disabled:

   * No instrumentation code is compiled or executed.
   * No JSON log is printed.
   * Application behavior must remain unchanged.
6. Only code relevant to Part 2 of the application is instrumented.

---

## **Definition of Part 2 scope**

The application performs two operations on the same input and produces two distinct outcomes.
Any code not explicitly excluded from Part 2 is considered part of Part 2 and must be instrumented as required by the emission rules.

---

## **Coding and design constraints**

### **Minimal intrusion**

* Do not rename or restructure existing code unless strictly required.
* Do not alter public APIs unless absolutely necessary.
* Do not significantly modify comments.

### **Instrumentation module**

* A module named `instrumentation` must be placed at the **end of the existing Rust source file**. It must never be placed in a separate file.
* The module must contain:

  * The single central data struct representing the entire JSON output.
  * All logic for collecting and updating instrumentation data.
  * A finalize and print function that outputs the JSON log.
* Only minimal helper functions and data structures may be publicly exposed.

### **Single data struct**

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
