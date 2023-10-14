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

**Implementation**

Abstractions are not defined in the cli they implemented in a separate lib called cli interfaces. 

