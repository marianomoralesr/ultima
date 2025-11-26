"""
Script para crear un usuario de prueba permanente con email y contraseña.

Este usuario se puede usar para testing automatizado sin OTP.
"""

import os
from supabase import create_client, Client

# Configuración de Supabase
SUPABASE_URL = "https://jjepfehmuybpctdzipnu.supabase.co"  # URL de tu proyecto
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')  # Service role key

if not SUPABASE_SERVICE_KEY:
    print("❌ Error: Necesitas configurar SUPABASE_SERVICE_ROLE_KEY")
    print("\nPara obtener tu Service Role Key:")
    print("1. Ve a https://supabase.com/dashboard")
    print("2. Selecciona tu proyecto")
    print("3. Settings > API")
    print("4. Copia 'service_role' key (secret)")
    print("\nLuego ejecuta:")
    print("export SUPABASE_SERVICE_ROLE_KEY='tu-service-role-key'")
    exit(1)

# Crear cliente de Supabase con service role
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Datos del usuario de prueba
TEST_USER = {
    "email": "test.automation@trefa.test",
    "password": "TestTrefa2024!",
    "user_metadata": {
        "test_user": True,
        "created_by": "testing_script"
    }
}

print("="*80)
print("🔧 CREANDO USUARIO DE PRUEBA PARA TESTING")
print("="*80)

try:
    # Verificar si el usuario ya existe
    print("\n→ Verificando si el usuario ya existe...")
    users_response = supabase.auth.admin.list_users()
    existing_user = None

    # La respuesta es una lista directa
    if users_response:
        for user in users_response:
            if user.email == TEST_USER["email"]:
                existing_user = user
                break

    if existing_user:
        print(f"⚠️  El usuario ya existe: {TEST_USER['email']}")
        print(f"   ID: {existing_user.id}")

        # Preguntar si quiere eliminarlo y recrearlo
        response = input("\n¿Quieres eliminarlo y recrearlo? (s/n): ")
        if response.lower() == 's':
            print(f"\n→ Eliminando usuario existente...")
            supabase.auth.admin.delete_user(existing_user.id)
            print("✅ Usuario eliminado")
        else:
            print("\n✅ Usando usuario existente")
            print(f"\n📧 Email: {TEST_USER['email']}")
            print(f"🔑 Password: {TEST_USER['password']}")
            exit(0)

    # Crear usuario
    print(f"\n→ Creando usuario: {TEST_USER['email']}")

    result = supabase.auth.admin.create_user({
        "email": TEST_USER["email"],
        "password": TEST_USER["password"],
        "email_confirm": True,  # Auto-confirmar email (sin OTP)
        "user_metadata": TEST_USER["user_metadata"]
    })

    if result.user:
        print("✅ Usuario creado exitosamente")
        print(f"\n📋 DETALLES DEL USUARIO DE PRUEBA:")
        print("="*80)
        print(f"📧 Email:    {TEST_USER['email']}")
        print(f"🔑 Password: {TEST_USER['password']}")
        print(f"🆔 ID:       {result.user.id}")
        print("="*80)

        # Crear perfil básico
        print("\n→ Creando perfil básico...")
        try:
            profile_data = {
                "id": result.user.id,
                "email": TEST_USER["email"],
                "first_name": "Usuario",
                "last_name": "Prueba",
                "mother_last_name": "Testing",
                "phone": "8112345678",
                "birth_date": "1990-01-01",
                "rfc": "PUET900101XXX",
                "homoclave": "XXX",
                "civil_status": "Soltero",
                "fiscal_situation": "Empleado",
                "role": "user"
            }

            supabase.table('profiles').insert(profile_data).execute()
            print("✅ Perfil básico creado")

        except Exception as profile_error:
            print(f"⚠️  Error creando perfil (no crítico): {profile_error}")

        print("\n" + "="*80)
        print("✅ CONFIGURACIÓN COMPLETA")
        print("="*80)
        print("\nAhora puedes usar este usuario para testing automatizado:")
        print(f"  Email:    {TEST_USER['email']}")
        print(f"  Password: {TEST_USER['password']}")
        print("\nEste usuario NO requiere OTP y puede hacer login con contraseña.")

    else:
        print("❌ Error: No se pudo crear el usuario")

except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
