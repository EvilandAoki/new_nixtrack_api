# Estandarización de Respuestas API

## 🎯 Objetivo

Estandarizar todas las respuestas de la API para que el frontend pueda procesar los datos de manera consistente.

## 📋 Formato de Respuestas

### Respuesta Exitosa

```typescript
{
  "success": true,
  "data": { ...datos... },
  "message": "Mensaje opcional"
}
```

### Respuesta de Error

```typescript
{
  "success": false,
  "message": "Mensaje de error",
  "errors": { ...errores opcionales... }
}
```

### Respuesta Paginada

```typescript
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

## 🛠️ Helper Creado

Se ha creado el archivo `src/utils/response.ts` con las siguientes funciones:

### sendSuccess()

Envía una respuesta exitosa.

```typescript
import { sendSuccess } from '../utils/response';

// Ejemplo básico
sendSuccess(res, { id: 1, name: 'Juan' });

// Con mensaje y código de estado
sendSuccess(res, { id: 1, name: 'Juan' }, 'Usuario creado', 201);
```

### sendError()

Envía una respuesta de error.

```typescript
import { sendError } from '../utils/response';

// Error básico
sendError(res, 'Usuario no encontrado', 404);

// Con detalles de errores
sendError(res, 'Validación fallida', 400, {
  email: ['Email es requerido'],
  password: ['Contraseña debe tener mínimo 6 caracteres']
});
```

### sendPaginated()

Envía una respuesta paginada.

```typescript
import { sendPaginated } from '../utils/response';

const users = await UserModel.findAll();
const total = await UserModel.count();

sendPaginated(res, users, total, page, limit);
```

## ✅ Controlador Ya Actualizado

### ✅ AuthController

El controlador de autenticación ya está usando el nuevo formato:

```typescript
import { sendSuccess, sendError } from '../utils/response';

export class AuthController {
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const result = await AuthService.login({ email, password });
      sendSuccess(res, result, 'Login successful');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      sendError(res, message, 401);
    }
  }
}
```

## 🔄 Controladores Pendientes de Actualizar

Necesitas actualizar los siguientes controladores para usar el mismo patrón:

### 1. UserController

**Antes:**
```typescript
res.json(users);
```

**Después:**
```typescript
import { sendSuccess, sendError, sendPaginated } from '../utils/response';

// Para listas paginadas
sendPaginated(res, users.data, users.total, page, limit);

// Para un solo usuario
sendSuccess(res, user);

// Para creación
sendSuccess(res, newUser, 'User created successfully', 201);
```

### 2. ClientController

**Antes:**
```typescript
res.json({
  data: result.data,
  pagination: {
    page: filters.page,
    limit: filters.limit,
    total: result.total,
    totalPages: Math.ceil(result.total / filters.limit),
  },
});
```

**Después:**
```typescript
import { sendPaginated } from '../utils/response';

sendPaginated(res, result.data, result.total, filters.page, filters.limit);
```

### 3. VehicleController
### 4. AgentController
### 5. OrderController
### 6. OrderDetailController
### 7. CatalogController
### 8. FileController
### 9. DashboardController

## 📝 Patrón de Actualización

Para cada controlador, sigue estos pasos:

### Paso 1: Importar los helpers

```typescript
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
```

### Paso 2: Reemplazar res.json() por sendSuccess()

**Antes:**
```typescript
res.json(data);
res.status(201).json(newItem);
```

**Después:**
```typescript
sendSuccess(res, data);
sendSuccess(res, newItem, 'Item created successfully', 201);
```

### Paso 3: Reemplazar errores por sendError()

**Antes:**
```typescript
res.status(404).json({ message: 'Not found' });
res.status(500).json({ message: 'Server error' });
```

**Después:**
```typescript
sendError(res, 'Not found', 404);
sendError(res, 'Server error', 500);
```

### Paso 4: Usar sendPaginated() para listas

**Antes:**
```typescript
res.json({
  data: items,
  pagination: { page, limit, total, totalPages }
});
```

**Después:**
```typescript
sendPaginated(res, items, total, page, limit);
```

## 🧪 Verificación

Después de actualizar cada controlador, verifica que:

1. El frontend pueda obtener los datos correctamente
2. Los errores se manejen apropiadamente
3. La paginación funcione como se espera

## 📊 Progreso

- [x] AuthController
- [x] UserController
- [x] ClientController
- [x] VehicleController
- [x] AgentController
- [x] OrderController
- [x] OrderDetailController
- [x] CatalogController
- [x] FileController
- [x] DashboardController
- [x] RoleController
- [ ] HealthController

## 🚀 Beneficios

1. **Consistencia**: Todas las respuestas tienen el mismo formato
2. **Mantenibilidad**: Más fácil de mantener y actualizar
3. **Tipado**: TypeScript puede inferir tipos correctamente
4. **Frontend**: El frontend puede confiar en una estructura consistente
5. **Debugging**: Más fácil identificar y depurar errores

## 💡 Recomendación

Actualiza los controladores uno por uno y prueba cada uno antes de continuar con el siguiente. Esto te permitirá detectar problemas temprano y asegurar que todo funcione correctamente.
