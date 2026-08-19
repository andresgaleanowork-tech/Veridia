# Authentication & RBAC

## Pre-configured Users (auth.js)

| Email | Password | Hash | Role |
|---|---|---|---|
| `nutri@veridia.tech` | `nutri123` | `97c65021d55a79db` | nutricionista |
| `secretaria@veridia.tech` | `secre123` | `5b0e6a3775b46381` | secretaria |
| `admin@veridia.tech` | `admin123` | `a63f45da7045830c` | admin |
| `superadmin@veridia.tech` | `superadmin123` | — (SuperAdmin panel) | superadmin |

Password hashing: `syncHash(str)` — custom 16-char hex (NOT cryptographic, for demo only).

## RBAC Roles (4 levels)

```javascript
var RBAC = {
  trial:        ['dashboard','agenda','pacientes','formula','bedca'],  // 5 modules, 20 patients, 14 days
  nutricionista:['dashboard','agenda','pacientes','historia','antropometria','analiticas',
                 'alertas','formula','desarrollada','bedca','recetas','planes','facturacion',
                 'caja','mensajes','ia'],  // 17 modules
  secretaria:   ['dashboard','agenda','pacientes','facturacion','caja','mensajes','contabilidad'],  // 7 modules
  admin:        ['dashboard','agenda','pacientes','historia','antropometria','analiticas',
                 'alertas','formula','soporte','desarrollada','bedca','recetas','planes',
                 'restauracion','facturacion','caja','contabilidad','mensajes','ia',
                 'auditoria','settings'],  // 21 modules (all)
};
```

## Trial Limitations
- Max 20 patients
- Max 5 modules
- 14-day expiry with modal upsell
- Warning at 3 days remaining

## Registration Flow
1. 2-step form (personal → professional + password)
2. Creates user with `role='trial'`
3. `checkPatientLimit()` enforced on patient creation

## Session Management
- Configurable timeout (15/30/60/120 min)
- Lock screen on timeout
- `SESSION_TIMEOUT_MS` variable
- Activity tracking via mouse/keyboard events

## Portal del Paciente Auth
- Login by email + password (stored as `portalPass` in patient record)
- Default password: `'1234'`
- Demo account: `demo@veridia.tech` / `demo`
- Registration with DNI auto-linking to existing clinic patients
- Fallback chain: Firestore → localStorage → demo patient

## SuperAdmin Auth
- Separate login page (`super-administrador.html`)
- Credentials: `superadmin@veridia.tech` / `superadmin123`
- Manages: clients, plans, tickets, billing, analytics, system config, API keys
