# ADR 0003: No database

## Status

Accepted

## Context

The challenge favours low cost and simple operation. Plans are personal and usually edited by one host on one device.

## Decision

Plans and progress live in the browser's local storage. The server is stateless apart from an in-memory LRU cache for AI ideas and an in-memory rate limiter.

## Consequences

- No hosting cost beyond the serverless functions, and no personal data stored on the server.
- Plans do not sync across devices. A shared store (for example Redis for rate limits, or a database for sync) is the scale-out path.
