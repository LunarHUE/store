---
'@lunarhue/store': patch
---

Split native-only tests onto Jest while keeping the existing web suite on
Vitest, and add dedicated React Native persistence coverage around provider
mounting and flush behavior to harden the 0.3.1 release path.
