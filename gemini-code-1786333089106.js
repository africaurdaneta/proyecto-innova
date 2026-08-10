// Verificar sesión activa al cargar el dashboard
const currentUser = JSON.parse(localStorage.getItem('innova_current_user'));
if (!currentUser) {
    window.location.href = 'index.html';
} else {
    document.getElementById('userNameDisplay').textContent = currentUser.name;
    document.getElementById('userRoleBadge').textContent = currentUser.role;

    // Aplicar restricciones de nivel de usuario
    if (currentUser.role === 'Basico') {
        const adminElements = document.querySelectorAll('.admin-only');
        adminElements.forEach(el => el.style.display = 'none');
    }
}

function logout() {
    localStorage.removeItem('innova_current_user');
    window.location.href = 'index.html';
}

// Navegación del Menú Lateral
const menuItems = document.querySelectorAll('.sidebar-menu li');
const sections = document.querySelectorAll('.content-section');

menuItems.forEach(item => {
    item.addEventListener('click', () => {
        menuItems.forEach(i => i.classList.remove('active'));
        sections.forEach(s => s.classList.remove('active-section'));

        item.classList.add('active');
        const targetId = item.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active-section');
        document.getElementById('sectionTitle').textContent = item.textContent.trim();
        
        if(targetId === 'dashboardSection') {
            updateDashboardMetricsAndCharts();
        }
    });
});

// Inicializar estructuras de datos locales si no existen
if (!localStorage.getItem('innova_orders')) {
    localStorage.setItem('innova_orders', JSON.stringify([
        { id: 1, client: 'Carlos Pérez', service: 'Soporte Redes', status: 'En Proceso' },
        { id: 2, client: 'María Rodríguez', service: 'Configuración Servidor', status: 'Completado' }
    ]));
}

if (!localStorage.getItem('innova_techs')) {
    localStorage.setItem('innova_techs', JSON.stringify([
        { id: 1, name: 'Pedro Gómez', specialty: 'Redes y Telecomunicaciones', status: 'En Ruta' },
        { id: 2, name: 'Ana Mendoza', specialty: 'Base de Datos', status: 'Disponible' }
    ]));
}

if (!localStorage.getItem('innova_inventory')) {
    localStorage.setItem('innova_inventory', JSON.stringify([
        { name: 'Router Cisco TP-Link', stock: 12, price: 45.00 },
        { name: 'Cable UTP Cat 6 (Rollo)', stock: 5, price: 85.50 }
    ]));
}

// --- GESTIÓN DE PEDIDOS ---
function renderOrders() {
    let orders = JSON.parse(localStorage.getItem('innova_orders'));
    let tbody = document.getElementById('ordersTableBody');
    tbody.innerHTML = '';
    orders.forEach(o => {
        tbody.innerHTML += `<tr>
            <td>#ORD-${o.id}</td>
            <td>${o.client}</td>
            <td>${o.service}</td>
            <td><b>${o.status}</b></td>
            <td><button class="btn-action btn-danger" onclick="deleteOrder(${o.id})">Eliminar</button></td>
        </tr>`;
    });
}

function addOrder(event) {
    event.preventDefault();
    const client = document.getElementById('clientName').value.trim();
    const service = document.getElementById('orderService').value.trim();
    const status = document.getElementById('orderStatus').value;

    let orders = JSON.parse(localStorage.getItem('innova_orders'));
    const newId = orders.length > 0 ? orders[orders.length - 1].id + 1 : 1;
    
    orders.push({ id: newId, client, service, status });
    localStorage.setItem('innova_orders', JSON.stringify(orders));
    
    event.target.reset();
    renderOrders();
    alert("Pedido registrado con éxito.");
}

function deleteOrder(id) {
    let orders = JSON.parse(localStorage.getItem('innova_orders'));
    orders = orders.filter(o => o.id !== id);
    localStorage.setItem('innova_orders', JSON.stringify(orders));
    renderOrders();
}

// --- GESTIÓN DE TÉCNICOS ---
function renderTechs() {
    let techs = JSON.parse(localStorage.getItem('innova_techs'));
    let tbody = document.getElementById('techTableBody');
    tbody.innerHTML = '';
    techs.forEach(t => {
        tbody.innerHTML += `<tr>
            <td>#TEC-${t.id}</td>
            <td>${t.name}</td>
            <td>${t.specialty}</td>
            <td>${t.status}</td>
            <td><button class="btn-action btn-danger" onclick="deleteTech(${t.id})">Eliminar</button></td>
        </tr>`;
    });
}

function addTechnician(event) {
    event.preventDefault();
    const name = document.getElementById('techName').value.trim();
    const specialty = document.getElementById('techSpecialty').value.trim();

    let techs = JSON.parse(localStorage.getItem('innova_techs'));
    const newId = techs.length > 0 ? techs[techs.length - 1].id + 1 : 1;

    techs.push({ id: newId, name, specialty, status: 'Disponible' });
    localStorage.setItem('innova_techs', JSON.stringify(techs));

    event.target.reset();
    renderTechs();
    alert("Técnico registrado correctamente.");
}

function deleteTech(id) {
    let techs = JSON.parse(localStorage.getItem('innova_techs'));
    techs = techs.filter(t => t.id !== id);
    localStorage.setItem('innova_techs', JSON.stringify(techs));
    renderTechs();
}

// --- INVENTARIO ---
function renderInventory() {
    if(currentUser.role === 'Basico') return;
    let inventory = JSON.parse(localStorage.getItem('innova_inventory'));
    let tbody = document.getElementById('inventoryTableBody');
    tbody.innerHTML = '';
    inventory.forEach((item, index) => {
        tbody.innerHTML += `<tr>
            <td>${item.name}</td>
            <td>${item.stock}</td>
            <td>$${item.price.toFixed(2)}</td>
            <td><button class="btn-action btn-danger" onclick="deleteInventory(${index})">Eliminar</button></td>
        </tr>`;
    });
}

function addInventoryItem(event) {
    event.preventDefault();
    const name = document.getElementById('itemName').value.trim();
    const stock = parseInt(document.getElementById('itemStock').value);
    const price = parseFloat(document.getElementById('itemPrice').value);

    let inventory = JSON.parse(localStorage.getItem('innova_inventory'));
    inventory.push({ name, stock, price });
    localStorage.setItem('innova_inventory', JSON.stringify(inventory));

    event.target.reset();
    renderInventory();
    alert("Producto agregado al inventario.");
}

function deleteInventory(index) {
    let inventory = JSON.parse(localStorage.getItem('innova_inventory'));
    inventory.splice(index, 1);
    localStorage.setItem('innova_inventory', JSON.stringify(inventory));
    renderInventory();
}

// --- DASHBOARD Y GRÁFICOS ESTADÍSTICOS (Chart.js) ---
let ordersChartInstance = null;
let techsChartInstance = null;

function updateDashboardMetricsAndCharts() {
    const orders = JSON.parse(localStorage.getItem('innova_orders')) || [];
    const techs = JSON.parse(localStorage.getItem('innova_techs')) || [];
    const inventory = JSON.parse(localStorage.getItem('innova_inventory')) || [];

    // Métricas numéricas
    document.getElementById('metricOrders').textContent = orders.length;
    document.getElementById('metricTechs').textContent = techs.length;
    document.getElementById('metricInventory').textContent = inventory.reduce((acc, item) => acc + item.stock, 0);

    // Contadores de estados de pedidos
    let pendingCount = orders.filter(o => o.status === 'Pendiente').length;
    let processCount = orders.filter(o => o.status === 'En Proceso').length;
    let completedCount = orders.filter(o => o.status === 'Completado').length;

    // Destruir gráficos anteriores para evitar solapamiento en memoria
    if (ordersChartInstance) ordersChartInstance.destroy();
    if (techsChartInstance) techsChartInstance.destroy();

    // Gráfico de Líneas / Barras: Estado de Pedidos
    const ctxOrders = document.getElementById('ordersChart').getContext('2d');
    ordersChartInstance = new Chart(ctxOrders, {
        type: 'bar',
        data: {
            labels: ['Pendientes', 'En Proceso', 'Completados'],
            datasets: [{
                label: 'Cantidad de Pedidos',
                data: [pendingCount, processCount, completedCount],
                backgroundColor: ['#f59e0b', '#3b82f6', '#10b981'],
                borderWidth: 1
            }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
    });

    // Gráfico de Pastel: Disponibilidad de Técnicos
    let availableTechs = techs.filter(t => t.status === 'Disponible').length;
    let busyTechs = techs.filter(t => t.status !== 'Disponible').length;

    const ctxTechs = document.getElementById('techsChart').getContext('2d');
    techsChartInstance = new Chart(ctxTechs, {
        type: 'doughnut',
        data: {
            labels: ['Disponibles', 'En Ruta / Ocupados'],
            datasets: [{
                data: [availableTechs, busyTechs],
                backgroundColor: ['#10b981', '#64748b']
            }]
        },
        options: { responsive: true }
    });
}

// Inicializar cargas iniciales al abrir
renderOrders();
renderTechs();
renderInventory();
updateDashboardMetricsAndCharts();