# Audit Runner

A cli application used to execute audits and process the results.

## The structure of an audit

## Available audits

- [Lighthouse User-Flow](https://github.com/GoogleChrome/lighthouse/blob/main/docs/user-flows.md)

## Planned audits

- [MemLab](https://facebook.github.io/memlab/docs/intro)

## Technical implementation

The CLI attempts to follow SOLID principles and Object-Oriented Programing.

### Dependency Inversion Principle (DIP)

**Definition:**

The Dependency Inversion Principle is one of the five SOLID principles of object-oriented design and programming.
It is aimed at reducing the coupling between high-level and low-level modules through abstraction.

**Key Points:**

- High-level modules should not depend on low-level modules.
- Both should depend on abstractions (interfaces or abstract classes).
- Abstractions should not depend on details. Details should depend on abstractions.

**Objective:**

To achieve decoupling in order to make the system more modular, easier to understand, change, and update.

**Implementation:**

Abstractions are not defined in the app they are implemented in a separate lib called cli interfaces.

These abstractions define the building blocks of the cli and the apis it can call.

The abstractions are then implemented in the lower level modules and are called and executed in the higher level modules.

The abstraction build apone each other and are assembel in the middleware to them be executed in the cli.

## Hardware requirements

To reduce variability in the results of the audits its important to follow the hardware recommendations outlined in
lighthouse is docs on [Variability](https://github.com/GoogleChrome/lighthouse/blob/main/docs/variability.md) and 
[Strategies for Dealing With Variance](https://github.com/GoogleChrome/lighthouse/blob/main/docs/variability.md#strategies-for-dealing-with-variance)
