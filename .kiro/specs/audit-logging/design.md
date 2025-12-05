# Audit Logging System - Design

## Architecture Overview

The audit logging system follows a service-oriented architecture with the following components:

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Audit Logs Page                                      │  │
│  │  - Search & Filter UI                                 │  │
│  │  - Log Table with Pagination                          │  │
│  │  - Detail View Modal                                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Backend Layer                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Audit Logs Controller                                │  │
│  │  - GET /audit-logs (query with filters)              │  │
│  │  - GET /audit-logs/:id (get single log)              │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Audit Service                                        │  │
│  │  - logAction(action, resource, changes, context)     │  │
│  │  - queryLogs(filters, pagination)                    │  │
│  │  - getLogById(id)                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Audit Middleware                                     │  │
│  │  - Captures user context (userId, IP, userAgent)     │  │
│  │  - Attaches to request object                         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Database Layer                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  AuditLog Table                                       │  │
│  │  - id, tenantId, userId, action, resourceType        │  │
│  │  - resourceId, changes, ipAddress, userAgent         │  │
│  │  - createdAt                                          │  │
│  │  Indexes: (tenantId, createdAt), (tenantId, userId)  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Backend Design

### 1. Audit Service (`backend/src/modules/audit/audit.service.ts`)

**Purpose:** Core service for creating and querying audit logs.

**Key Methods:**

```typescript
class AuditService {
  // Create audit log entry
  async logAction(params: {
    tenantId: string;
    userId: string;
    action: AuditAction;
    resourceType: string;
    resourceId: string;
    changes?: Record<string, { old: any; new: any }>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void>

  // Query audit logs with filters
  async queryLogs(
    tenantId: string,
    filters: AuditLogFilters,
    pagination: { page: number; limit: number }
  ): Promise<{
    logs: AuditLog[];
    pagination: PaginationInfo;
  }>

  // Get single audit log by ID
  async getLogById(tenantId: string, logId: string): Promise<AuditLog>

  // Helper: Calculate changes between old and new objects
  private calculateChanges(
    oldData: Record<string, any>,
    newData: Record<string, any>,
    excludeFields: string[]
  ): Record<string, { old: any; new: any }>
}
```

**Implementation Notes:**
- Use `randomUUID()` for log IDs
- Wrap in try-catch to prevent audit failures from blocking operations
- Log audit failures to console/monitoring system
- Exclude sensitive fields: `passwordHash`, `password`, `token`

---

### 2. Audit Middleware (`backend/src/middleware/audit.middleware.ts`)

**Purpose:** Capture user context (IP address, user agent) and attach to request.

```typescript
export interface AuditContext {
  userId: string;
  tenantId: string;
  ipAddress: string;
  userAgent: string;
}

export function auditMiddleware(req: Request, res: Response, next: NextFunction) {
  // Extract IP address (handle proxies)
  const ipAddress = 
    req.headers['x-forwarded-for']?.toString().split(',')[0] ||
    req.headers['x-real-ip']?.toString() ||
    req.socket.remoteAddress ||
    'unknown';

  // Extract user agent
  const userAgent = req.headers['user-agent'] || 'unknown';

  // Attach to request (assuming auth middleware already set req.user)
  req.auditContext = {
    userId: req.user?.id,
    tenantId: req.user?.tenantId,
    ipAddress,
    userAgent,
  };

  next();
}
```

---

### 3. Service Integration Pattern

**Pattern:** Each service method that performs a logged operation should call the audit service.

**Example: Patient Service**

```typescript
async createPatient(tenantId: string, input: CreatePatientInput, auditContext: AuditContext) {
  const patient = await prisma.patient.create({
    data: { /* ... */ }
  });

  // Log the action
  await auditService.logAction({
    tenantId,
    userId: auditContext.userId,
    action: 'CREATE',
    resourceType: 'Patient',
    resourceId: patient.id,
    ipAddress: auditContext.ipAddress,
    userAgent: auditContext.userAgent,
  });

  return patient;
}

async updatePatient(
  tenantId: string,
  patientId: string,
  input: UpdatePatientInput,
  auditContext: AuditContext
) {
  // Get old data
  const oldPatient = await prisma.patient.findUnique({ where: { id: patientId } });

  // Update
  const patient = await prisma.patient.update({
    where: { id: patientId },
    data: input,
  });

  // Calculate changes
  const changes = auditService.calculateChanges(oldPatient, patient, ['updatedAt']);

  // Log the action
  await auditService.logAction({
    tenantId,
    userId: auditContext.userId,
    action: 'UPDATE',
    resourceType: 'Patient',
    resourceId: patient.id,
    changes,
    ipAddress: auditContext.ipAddress,
    userAgent: auditContext.userAgent,
  });

  return patient;
}
```

---

### 4. Controller Layer

**Audit Logs Controller** (`backend/src/modules/audit/audit.controller.ts`)

```typescript
class AuditLogsController {
  // GET /audit-logs
  async queryLogs(req: Request, res: Response) {
    const { tenantId, userId } = req.user;
    
    // Check authorization
    if (!['WORKSPACE_ADMIN', 'ACCOUNTANT'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const filters = {
      userId: req.query.userId,
      action: req.query.action,
      resourceType: req.query.resourceType,
      resourceId: req.query.resourceId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      search: req.query.search,
    };

    const pagination = {
      page: parseInt(req.query.page) || 1,
      limit: Math.min(parseInt(req.query.limit) || 50, 100),
    };

    const result = await auditService.queryLogs(tenantId, filters, pagination);
    
    res.json({ data: result });
  }

  // GET /audit-logs/:id
  async getLogById(req: Request, res: Response) {
    const { tenantId } = req.user;
    const { id } = req.params;

    const log = await auditService.getLogById(tenantId, id);
    
    res.json({ data: log });
  }
}
```

---

## Frontend Design

### 1. Page Structure

**Route:** `/audit-logs`

**Components:**
```
AuditLogsPage
├── AuditLogsHeader (title, description)
├── AuditLogsFilters
│   ├── DateRangePicker
│   ├── ActionTypeSelect
│   ├── ResourceTypeSelect
│   ├── UserSelect
│   └── SearchInput
├── AuditLogsTable
│   ├── AuditLogRow (expandable)
│   └── AuditLogDetailModal
└── Pagination
```

---

### 2. Key Components

#### AuditLogsFilters Component

```typescript
interface AuditLogsFiltersProps {
  filters: AuditLogFilters;
  onFiltersChange: (filters: AuditLogFilters) => void;
  users: User[];
  presetContext?: {
    resourceType?: string;
    resourceId?: string;
    label?: string;
  };
}

export function AuditLogsFilters({ 
  filters, 
  onFiltersChange, 
  users,
  presetContext 
}: AuditLogsFiltersProps) {
  return (
    <Card>
      <CardContent className="space-y-4">
        {/* Preset Context Banner */}
        {presetContext && (
          <Alert>
            <AlertDescription className="flex items-center justify-between">
              <span>
                Showing logs for: <strong>{presetContext.label}</strong>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFiltersChange({ 
                  ...filters, 
                  resourceType: '', 
                  resourceId: '' 
                })}
              >
                Clear Filter
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Date Range Picker with Presets */}
        <div className="space-y-2">
          <Label>Date Range</Label>
          <div className="flex gap-2">
            <Button
              variant={filters.preset === 'today' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFiltersChange({ 
                ...filters, 
                preset: 'today',
                startDate: format(new Date(), 'yyyy-MM-dd'),
                endDate: format(new Date(), 'yyyy-MM-dd')
              })}
            >
              Today
            </Button>
            <Button
              variant={filters.preset === 'yesterday' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                const yesterday = subDays(new Date(), 1);
                onFiltersChange({ 
                  ...filters, 
                  preset: 'yesterday',
                  startDate: format(yesterday, 'yyyy-MM-dd'),
                  endDate: format(yesterday, 'yyyy-MM-dd')
                });
              }}
            >
              Yesterday
            </Button>
            <Button
              variant={filters.preset === 'last7days' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFiltersChange({ 
                ...filters, 
                preset: 'last7days',
                startDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
                endDate: format(new Date(), 'yyyy-MM-dd')
              })}
            >
              Last 7 Days
            </Button>
            <Button
              variant={filters.preset === 'last30days' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFiltersChange({ 
                ...filters, 
                preset: 'last30days',
                startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
                endDate: format(new Date(), 'yyyy-MM-dd')
              })}
            >
              Last 30 Days
            </Button>
          </div>
          
          <DateRangePicker
            from={filters.startDate}
            to={filters.endDate}
            onChange={(range) => onFiltersChange({ 
              ...filters, 
              preset: 'custom',
              ...range 
            })}
          />
        </div>
        
        <Select
          value={filters.action}
          onValueChange={(action) => onFiltersChange({ ...filters, action })}
        >
          <SelectItem value="">All Actions</SelectItem>
          <SelectItem value="CREATE">Create</SelectItem>
          <SelectItem value="UPDATE">Update</SelectItem>
          <SelectItem value="DELETE">Delete</SelectItem>
          <SelectItem value="CANCEL">Cancel</SelectItem>
          <SelectItem value="LOGIN">Login</SelectItem>
          <SelectItem value="LOGOUT">Logout</SelectItem>
        </Select>

        <Select
          value={filters.resourceType}
          onValueChange={(resourceType) => onFiltersChange({ ...filters, resourceType })}
          disabled={!!presetContext?.resourceType}
        >
          <SelectItem value="">All Resources</SelectItem>
          <SelectItem value="Patient">Patient</SelectItem>
          <SelectItem value="Therapist">Therapist</SelectItem>
          <SelectItem value="Session">Session</SelectItem>
          <SelectItem value="Invoice">Invoice</SelectItem>
          <SelectItem value="Payment">Payment</SelectItem>
        </Select>

        <Input
          placeholder="Search..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
        />
      </CardContent>
    </Card>
  );
}
```

#### AuditLogsTable Component

```typescript
export function AuditLogsTable({ logs }: { logs: AuditLog[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Timestamp</TableHead>
          <TableHead>User</TableHead>
          <TableHead>Action</TableHead>
          <TableHead>Resource</TableHead>
          <TableHead>Details</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => (
          <AuditLogRow
            key={log.id}
            log={log}
            expanded={expandedId === log.id}
            onToggle={() => setExpandedId(expandedId === log.id ? null : log.id)}
          />
        ))}
      </TableBody>
    </Table>
  );
}
```

---

### 3. Data Fetching Hook

```typescript
export function useAuditLogs(filters: AuditLogFilters, pagination: Pagination) {
  return useQuery({
    queryKey: ['audit-logs', filters, pagination],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...filters,
      });
      
      const response = await api.get(`/audit-logs?${params}`);
      return response.data.data;
    },
  });
}
```

---

### 4. Contextual Audit Log Links

**Integration Points:**

#### Patient Detail Page
```typescript
// Add to patient detail page
<Button
  variant="outline"
  onClick={() => router.push(
    `/audit-logs?resourceType=Patient&resourceId=${patient.id}`
  )}
>
  <History className="mr-2 h-4 w-4" />
  View Audit History ({auditLogCount})
</Button>
```

#### Session Detail/List
```typescript
// Add to session row actions
<DropdownMenuItem
  onClick={() => router.push(
    `/audit-logs?resourceType=Session&resourceId=${session.id}`
  )}
>
  <History className="mr-2 h-4 w-4" />
  View History
</DropdownMenuItem>
```

#### Invoice Detail Page
```typescript
// Add to invoice detail page
<Button
  variant="ghost"
  size="sm"
  onClick={() => router.push(
    `/audit-logs?resourceType=Invoice&resourceId=${invoice.id}`
  )}
>
  <History className="mr-2 h-4 w-4" />
  Audit Trail
</Button>
```

**URL Pattern:**
- `/audit-logs` - All logs
- `/audit-logs?resourceType=Patient&resourceId=123` - Logs for specific patient
- `/audit-logs?startDate=2024-01-01&endDate=2024-01-31` - Logs for date range
- `/audit-logs?action=CREATE&resourceType=Session` - All session creations

**Query Parameter Handling:**
```typescript
// In AuditLogsPage component
const searchParams = useSearchParams();
const initialFilters = {
  resourceType: searchParams.get('resourceType') || '',
  resourceId: searchParams.get('resourceId') || '',
  startDate: searchParams.get('startDate') || '',
  endDate: searchParams.get('endDate') || '',
  action: searchParams.get('action') || '',
};
```

---

## Database Schema

Already defined in `schema.prisma`:

```prisma
model AuditLog {
  id           String      @id
  tenantId     String
  userId       String
  action       AuditAction
  resourceType String
  resourceId   String
  changes      Json?
  ipAddress    String?
  userAgent    String?
  createdAt    DateTime    @default(now())
  Tenant       Tenant      @relation(fields: [tenantId], references: [id])
  User         User        @relation(fields: [userId], references: [id])

  @@index([tenantId, createdAt])
  @@index([tenantId, resourceType, resourceId])
  @@index([tenantId, userId])
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
  CANCEL
  LOGIN
  LOGOUT
}
```

---

## UI/UX Design

### Color Coding for Actions

- **CREATE**: Green badge
- **UPDATE**: Blue badge
- **DELETE**: Red badge
- **CANCEL**: Orange badge
- **LOGIN**: Purple badge
- **LOGOUT**: Gray badge

### Expandable Rows

When a row is expanded, show:
- Full changes diff (old → new)
- IP address
- User agent
- Full timestamp with timezone

### Empty States

- No logs found: "No audit logs match your filters"
- No logs at all: "No audit logs yet. Activity will appear here."

---

## Performance Considerations

1. **Indexing Strategy:**
   - Primary index: `(tenantId, createdAt)` for time-based queries
   - Secondary index: `(tenantId, resourceType, resourceId)` for resource lookups
   - Tertiary index: `(tenantId, userId)` for user activity

2. **Query Optimization:**
   - Limit default page size to 50 entries
   - Use cursor-based pagination for large datasets
   - Cache user information to avoid N+1 queries

3. **Async Logging:**
   - Audit logging should not block primary operations
   - Use fire-and-forget pattern with error logging

---

## Security Considerations

1. **Access Control:**
   - Only WORKSPACE_ADMIN and ACCOUNTANT can view logs
   - Enforce tenant isolation
   - Log access to audit logs themselves

2. **Data Protection:**
   - Never log passwords or tokens
   - Mask sensitive PII in changes
   - Implement data retention policies

3. **Immutability:**
   - Audit logs cannot be updated or deleted (except by retention policy)
   - Use database constraints to enforce

---

## Testing Strategy

1. **Unit Tests:**
   - Audit service methods
   - Change calculation logic
   - Filter query building

2. **Integration Tests:**
   - End-to-end audit logging for each operation
   - Query API with various filters
   - Authorization checks

3. **Performance Tests:**
   - Query performance with 1M+ logs
   - Concurrent audit log writes
   - Filter query optimization

---

## Migration Strategy

1. **Phase 1:** Implement audit service and middleware
2. **Phase 2:** Integrate into patient and therapist services
3. **Phase 3:** Integrate into session and invoice services
4. **Phase 4:** Implement frontend UI
5. **Phase 5:** Add authentication logging
6. **Phase 6:** Performance optimization and monitoring
