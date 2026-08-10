// Validar y cambiar formularios de login/registro
function toggleForms() {
    document.getElementById('loginForm').classList.toggle('hidden');
    document.getElementById('registerForm').classList.toggle('hidden');
}

// Inicializar base de datos de usuarios por defecto si no existe
if (!localStorage.getItem('innova_users')) {
    const defaultUsers = [
        { name: 'Administrador General', email: 'admin@innova.com', password: 'admin123', role: 'Administrador' },
        { name: 'Operador Básico', email: 'user@innova.com', password: 'user123', role: 'Basico' }
    ];
    localStorage.setItem('innova_users', JSON.stringify(defaultUsers));
}

// Registro de Usuario con validación rigurosa
function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const role = document.getElementById('regRole').value;

    // Validación estricta de formato del nombre (solo letras)
    const nameRegex = /^[A-Za-zÀ-ÿ\s]+$/;
    if (!nameRegex.test(name)) {
        alert("El nombre solo debe contener letras y espacios.");
        return;
    }

    let users = JSON.parse(localStorage.getItem('innova_users'));
    
    // Verificar si el correo ya está registrado
    if (users.some(u => u.email === email)) {
        alert("El correo electrónico ya se encuentra registrado.");
        return;
    }

    users.push({ name, email, password, role });
    localStorage.setItem('innova_users', JSON.stringify(users));
    alert("¡Usuario registrado con éxito! Ahora puedes iniciar sesión.");
    toggleForms();
}

// Inicio de Sesión
function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    let users = JSON.parse(localStorage.getItem('innova_users'));
    const validUser = users.find(u => u.email === email && u.password === password);

    if (validUser) {
        localStorage.setItem('innova_current_user', JSON.stringify(validUser));
        window.location.href = 'dashboard.html';
    } else {
        alert("Credenciales incorrectas. Verifique su correo y contraseña.");
    }
}