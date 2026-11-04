export interface Migration {
  readonly id: string;
  readonly sql: string;
}

export const migrations: readonly Migration[] = [
  {
    id: '001_identity_schema',
    sql: `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        full_name VARCHAR(300) NOT NULL,
        document_type VARCHAR(20),
        document_number VARCHAR(30),
        email VARCHAR(254) NOT NULL UNIQUE CHECK (email = LOWER(email)),
        phone VARCHAR(20),
        password_hash TEXT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'deleted')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ,
        CHECK ((document_type IS NULL) = (document_number IS NULL)),
        CHECK (document_type IS NULL OR document_type IN ('dni', 'foreign_id', 'passport'))
      );

      CREATE UNIQUE INDEX IF NOT EXISTS users_document_unique
        ON users (document_type, document_number)
        WHERE document_type IS NOT NULL;

      CREATE TABLE IF NOT EXISTS roles (
        id UUID PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        description VARCHAR(300) NOT NULL,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS user_roles (
        user_id UUID NOT NULL REFERENCES users(id),
        role_id UUID NOT NULL REFERENCES roles(id),
        assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        assigned_by UUID REFERENCES users(id),
        PRIMARY KEY (user_id, role_id)
      );

      CREATE TABLE IF NOT EXISTS consents (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id),
        type VARCHAR(50) NOT NULL CHECK (type IN ('health_data_processing')),
        policy_version VARCHAR(50) NOT NULL,
        accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        revoked_at TIMESTAMPTZ,
        UNIQUE (user_id, type, policy_version)
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id),
        token_hash CHAR(64) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        revoked_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        user_agent_hash CHAR(64),
        ip_hash CHAR(64)
      );

      CREATE INDEX IF NOT EXISTS sessions_user_id_index ON sessions (user_id);
      CREATE INDEX IF NOT EXISTS sessions_active_index ON sessions (id, expires_at) WHERE revoked_at IS NULL;

      INSERT INTO roles (id, code, name, description)
      VALUES
        ('00000000-0000-0000-0000-000000000001', 'customer', 'Cliente', 'Compra productos y administra su perfil.'),
        ('00000000-0000-0000-0000-000000000002', 'administrator', 'Administrador', 'Administra usuarios y la operación de la botica.'),
        ('00000000-0000-0000-0000-000000000003', 'pharmacist', 'Químico farmacéutico', 'Revisa recetas y dispensa productos regulados.')
      ON CONFLICT (code) DO NOTHING;
    `,
  },
];
