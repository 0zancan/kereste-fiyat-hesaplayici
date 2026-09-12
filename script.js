const STORAGE_KEY = 'keresteAppStateV1';

const defaultState = {
  m3Price: 1800,
  defaultM3Price: 1800,
  selectedSupplierId: 'default',
  suppliers: [
    { id: 'default', name: 'Varsayılan', price: 1800, active: true },
  ],
  currency: 'TRY',
  includeTax: false,
  theme: 'light',
  mode: 'auto',
  customRatios: {
    '10x10': 1,
    '5x10': 0.5,
    '5x5': 0.25,
    '2x8': 0.15,
  },
  cart: [],
  projects: [],
  selectedProjectId: null,
};

let editingMaterialId = null;

const productPriceMap = {
  '10x10 cm / 2 m': 225,
  '5x10 cm / 2 m': 150,
  '5x5 cm / 2 m': 90,
  '2x8 cm / 2 m': 75,
  '10x10 cm / 1 m': 120,
  '5x10 cm / 1 m': 75,
  '5x5 cm / 1 m': 45,
  '2x8 cm / 1 m': 45,
};

const referenceProducts = [
  { width: 10, height: 10, length: 2, quantity: 2, label: '10x10 cm / 2 m' },
  { width: 5, height: 10, length: 2, quantity: 1, label: '5x10 cm / 2 m' },
  { width: 5, height: 5, length: 2, quantity: 3, label: '5x5 cm / 2 m' },
  { width: 2, height: 8, length: 2, quantity: 4, label: '2x8 cm / 2 m' },
  { width: 10, height: 10, length: 1, quantity: 2, label: '10x10 cm / 1 m' },
  { width: 5, height: 10, length: 1, quantity: 1, label: '5x10 cm / 1 m' },
  { width: 5, height: 5, length: 1, quantity: 3, label: '5x5 cm / 1 m' },
  { width: 2, height: 8, length: 1, quantity: 14, label: '2x8 cm / 1 m' },
];

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    const normalized = saved ? { ...saved } : {};
    const suppliers = Array.isArray(normalized.suppliers) && normalized.suppliers.length
      ? normalized.suppliers.map((supplier) => ({
          ...supplier,
          price: Number(supplier.price) || 1800,
          active: Boolean(supplier.active),
        }))
      : defaultState.suppliers.map((supplier) => ({ ...supplier }));

    const selectedSupplierId = normalized.selectedSupplierId || suppliers[0].id;
    suppliers.forEach((supplier) => {
      supplier.active = supplier.id === selectedSupplierId;
    });

    const defaultM3Price = Number(normalized.defaultM3Price) || Number(suppliers[0].price) || 1800;
    const m3Price = Number(normalized.m3Price) || Number(suppliers.find((supplier) => supplier.id === selectedSupplierId)?.price) || defaultM3Price;

    return {
      ...defaultState,
      ...normalized,
      selectedSupplierId,
      suppliers,
      defaultM3Price,
      m3Price,
      customRatios: {
        ...defaultState.customRatios,
        ...((normalized && normalized.customRatios) || {}),
      },
    };
  } catch (error) {
    return { ...defaultState };
  }
}

const state = loadState();

const standardGrid = document.getElementById('standardGrid');
const widthInput = document.getElementById('widthInput');
const heightInput = document.getElementById('heightInput');
const lengthSelect = document.getElementById('lengthSelect');
const qtyInput = document.getElementById('qtyInput');
const m3WidthInput = document.getElementById('m3WidthInput');
const m3HeightInput = document.getElementById('m3HeightInput');
const m3LengthInput = document.getElementById('m3LengthInput');
const m3UnitPriceInput = document.getElementById('m3UnitPriceInput');
const m3VolumeText = document.getElementById('m3VolumeText');
const m3TotalText = document.getElementById('m3TotalText');
const m3PriceText = document.getElementById('m3PriceText');
const m3RateBadge = document.getElementById('m3RateBadge');
const previewImage = document.getElementById('previewImage');
const previewName = document.getElementById('previewName');
const previewPrice = document.getElementById('previewPrice');
const addToCartBtn = document.getElementById('addToCartBtn');
const cartList = document.getElementById('cartList');
const cartTotal = document.getElementById('cartTotal');
const cartCountBadge = document.getElementById('cartCountBadge');
const packageBadge = document.getElementById('packageBadge');
const projectNameInput = document.getElementById('projectNameInput');
const projectCreateBtn = document.getElementById('projectCreateBtn');
const projectMaterialNameInput = document.getElementById('projectMaterialNameInput');
const projectQtyInput = document.getElementById('projectQtyInput');
const projectWidthInput = document.getElementById('projectWidthInput');
const projectHeightInput = document.getElementById('projectHeightInput');
const projectLengthInput = document.getElementById('projectLengthInput');
const addProjectMaterialBtn = document.getElementById('addProjectMaterialBtn');
const projectList = document.getElementById('projectList');
const projectSizeButtons = document.querySelectorAll('.project-size-pill');
const m3PriceInput = document.getElementById('m3PriceInput');
const defaultM3PriceInput = document.getElementById('defaultM3PriceInput');
const resetM3PriceBtn = document.getElementById('resetM3PriceBtn');
const supplierNameInput = document.getElementById('supplierNameInput');
const supplierPriceInput = document.getElementById('supplierPriceInput');
const addSupplierBtn = document.getElementById('addSupplierBtn');
const supplierList = document.getElementById('supplierList');
const currencySelect = document.getElementById('currencySelect');
const taxToggle = document.getElementById('taxToggle');
const ratio10x10 = document.getElementById('ratio10x10');
const ratio5x10 = document.getElementById('ratio5x10');
const ratio5x5 = document.getElementById('ratio5x5');
const ratio2x8 = document.getElementById('ratio2x8');
const themeToggle = document.getElementById('themeToggle');

const formatMoney = (value) => {
  const amount = Math.round(value);
  const symbol = state.currency === 'USD' ? '$' : state.currency === 'EUR' ? '€' : '₺';
  return `${symbol} ${amount.toLocaleString('tr-TR')}`;
};

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getActiveSupplier() {
  const active = state.suppliers.find((supplier) => supplier.id === state.selectedSupplierId);
  if (active) return active;
  if (state.suppliers.length) {
    state.selectedSupplierId = state.suppliers[0].id;
    return state.suppliers[0];
  }
  return null;
}

function getCurrentSupplierPrice() {
  const activeSupplier = getActiveSupplier();
  if (activeSupplier) {
    state.m3Price = Number(activeSupplier.price) || 0;
    return state.m3Price;
  }
  return Number(state.m3Price) || Number(state.defaultM3Price) || 1800;
}

function createWoodSvg(label, width, height, length) {
  const labelText = label.length > 18 ? label.slice(0, 18) + '…' : label;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="180" viewBox="0 0 300 180">
      <defs>
        <linearGradient id="woodBg" x1="0" x2="1">
          <stop offset="0%" stop-color="#f3dfb0" />
          <stop offset="100%" stop-color="#d3a05d" />
        </linearGradient>
      </defs>
      <rect width="300" height="180" fill="#f5e9d1" />
      <g transform="translate(75 32)">
        <rect x="0" y="0" width="150" height="96" rx="12" fill="url(#woodBg)" stroke="#8d623a" stroke-width="3"/>
        <path d="M0 22 C22 10, 48 46, 72 20 S112 10, 150 28" fill="none" stroke="#a06d39" stroke-width="4" opacity="0.65"/>
        <path d="M0 42 C28 28, 52 54, 77 38 S120 24, 150 40" fill="none" stroke="#b97b39" stroke-width="3" opacity="0.72"/>
        <path d="M0 68 C30 58, 48 82, 84 68 S116 62, 150 70" fill="none" stroke="#8c5b2c" stroke-width="3" opacity="0.7"/>
        <path d="M0 84 C28 76, 58 100, 96 80 S130 80, 150 90" fill="none" stroke="#785126" stroke-width="2.5" opacity="0.7"/>
      </g>
      <text x="150" y="148" text-anchor="middle" font-size="15" font-weight="700" fill="#4d3417">${labelText}</text>
      <text x="150" y="166" text-anchor="middle" font-size="12" fill="#6e4d2f">${width} x ${height} cm • ${length} m</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function computeVolumePrice(width, height, length) {
  const pricePerM3 = getCurrentSupplierPrice();
  if (!pricePerM3) return 0;

  const volumeInM3 = (Number(width) / 100) * (Number(height) / 100) * Number(length);
  return volumeInM3 * pricePerM3;
}

function computeManualPrice(width, height, length) {
  return computeVolumePrice(width, height, length);
}

function computeAutoPrice(width, height, length) {
  return computeVolumePrice(width, height, length);
}

function getProductData(width, height, length) {
  const safeWidth = Number(width) || 10;
  const safeHeight = Number(height) || 10;
  const safeLength = Number(length) || 2;

  const standard = referenceProducts.find(
    (item) => item.width === safeWidth && item.height === safeHeight && item.length === safeLength
  );

  const label = standard ? standard.label : `${safeWidth}x${safeHeight} cm / ${safeLength} m`;
  const unitPrice = state.mode === 'manual'
    ? computeManualPrice(safeWidth, safeHeight, safeLength)
    : computeAutoPrice(safeWidth, safeHeight, safeLength);

  return {
    label,
    unitPrice,
    image: createWoodSvg(label, safeWidth, safeHeight, safeLength),
  };
}

function renderStandardSizes() {
  standardGrid.innerHTML = '';
  const sizes = ['10x10', '5x10', '5x5', '2x8'];

  sizes.forEach((size) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'size-pill';
    button.textContent = size;

    button.addEventListener('click', () => {
      const [w, h] = size.split('x').map(Number);
      widthInput.value = w;
      heightInput.value = h;
      document.querySelectorAll('.size-pill').forEach((pill) => pill.classList.toggle('is-selected', pill === button));
      updatePreview();
    });

    standardGrid.appendChild(button);
  });
}

function updatePreview() {
  const width = Number(widthInput.value) || 10;
  const height = Number(heightInput.value) || 10;
  const length = Number(lengthSelect.value) || 2;
  const supplier = getActiveSupplier();
  const product = getProductData(width, height, length);

  previewImage.src = product.image;
  previewName.textContent = product.label;
  previewPrice.textContent = `1 adet fiyat: ${formatMoney(product.unitPrice)} / adet • ${supplier ? supplier.name : 'Firma'}`;
}

function renderCart() {
  if (!state.cart.length) {
    cartList.innerHTML = '<div class="empty-state">Sepetiniz boş. Yeni ürün ekleyerek sipariş oluşturabilirsiniz.</div>';
    cartTotal.textContent = '0 TL';
    cartCountBadge.textContent = '0 ürün';
    return;
  }

  const total = state.cart.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
  cartTotal.textContent = formatMoney(total);
  cartCountBadge.textContent = `${state.cart.length} ürün`;

  cartList.innerHTML = '';
  state.cart.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'cart-row';
    row.innerHTML = `
      <div class="meta">
        <strong>${item.label}</strong>
        <span>${item.qty} adet • ${item.length} m • ${item.supplierName}</span>
      </div>
      <div class="amount">${formatMoney(item.qty * item.unitPrice)}</div>
      <div style="display:flex; gap:8px;">
        <button class="cart-action" type="button" data-action="edit" data-id="${item.id}">Düzenle</button>
        <button class="cart-action" type="button" data-action="delete" data-id="${item.id}">Sil</button>
      </div>
    `;

    row.querySelector('[data-action="edit"]').addEventListener('click', () => editCartItem(item));
    row.querySelector('[data-action="delete"]').addEventListener('click', () => removeCartItem(item.id));
    cartList.appendChild(row);
  });
}

function getMaterialVolume(width, height, length) {
  return (Number(width) / 100) * (Number(height) / 100) * Number(length || 0);
}

function getProjectMaterialCost(material, supplier) {
  const volume = getMaterialVolume(material.width, material.height, material.length);
  return volume * Number(material.qty || 1) * Number(supplier.price || 0);
}

function getProjectTotalBySupplier(project, supplier) {
  if (!project || !project.materials) return 0;
  return project.materials.reduce((sum, material) => sum + getProjectMaterialCost(material, supplier), 0);
}

function getProjectTotal(project) {
  if (!project || !project.materials) return 0;
  return state.suppliers.reduce((sum, supplier) => sum + getProjectTotalBySupplier(project, supplier), 0);
}

function getProjectVolume(project) {
  if (!project || !project.materials) return 0;
  return project.materials.reduce((sum, material) => {
    return sum + getMaterialVolume(material.width, material.height, material.length) * Number(material.qty || 1);
  }, 0);
}

function getLowestProjectQuote(project) {
  if (!project || !project.materials || !state.suppliers.length) return 0;
  return Math.min(...state.suppliers.map((supplier) => getProjectTotalBySupplier(project, supplier)));
}

function getBestSupplierForProject(project) {
  if (!project || !project.materials || !state.suppliers.length) return null;
  return state.suppliers.reduce((best, supplier) => {
    const currentTotal = getProjectTotalBySupplier(project, supplier);
    if (!best || currentTotal < best.total) {
      return { supplier, total: currentTotal };
    }
    return best;
  }, null);
}

function resetProjectForm() {
  editingMaterialId = null;
  projectMaterialNameInput.value = '';
  projectQtyInput.value = '1';
  projectWidthInput.value = '10';
  projectHeightInput.value = '10';
  projectLengthInput.value = '2';
  projectSizeButtons.forEach((button) => {
    const isCustom = button.dataset.projectSize === 'custom';
    button.classList.toggle('is-selected', isCustom ? false : button.dataset.projectSize === '10x10x2');
  });
  addProjectMaterialBtn.textContent = 'Ahşap ekle';
}

function applyProjectSize(sizeKey) {
  const sizeMap = {
    '10x10x2': { width: 10, height: 10, length: 2, label: '10x10 / 2m' },
    '5x10x2': { width: 5, height: 10, length: 2, label: '5x10 / 2m' },
    '5x5x2': { width: 5, height: 5, length: 2, label: '5x5 / 2m' },
    '2x8x2': { width: 2, height: 8, length: 2, label: '2x8 / 2m' },
    custom: null,
  };

  const preset = sizeMap[sizeKey];
  projectSizeButtons.forEach((button) => {
    button.classList.toggle('is-selected', button.dataset.projectSize === sizeKey);
  });

  if (!preset) {
    projectMaterialNameInput.value = '';
    return;
  }

  projectWidthInput.value = preset.width;
  projectHeightInput.value = preset.height;
  projectLengthInput.value = preset.length;
  projectMaterialNameInput.value = preset.label;
}

function renderProjects() {
  if (!projectList) return;

  if (!state.projects.length) {
    projectList.innerHTML = '<div class="empty-state">Henüz proje yok. Üstte yeni proje oluşturup ahşap ekleyebilirsiniz.</div>';
    return;
  }

  projectList.innerHTML = '';

  state.projects.forEach((project) => {
    const projectVolume = getProjectVolume(project);
    const lowestQuote = getLowestProjectQuote(project);
    const bestSupplier = getBestSupplierForProject(project);
    const isSelected = state.selectedProjectId === project.id;

    const card = document.createElement('div');
    card.className = 'project-item';
    card.style.borderColor = isSelected ? 'var(--primary)' : 'var(--line)';
    card.style.boxShadow = isSelected ? 'inset 0 0 0 1px rgba(141, 90, 38, 0.18)' : 'none';

    const summaryCard = document.createElement('div');
    summaryCard.className = 'project-summary-card';
    summaryCard.innerHTML = `
      <div class="project-summary-header">
        <span class="project-summary-label">En düşük teklif</span>
        <span class="badge">${project.materials.length} kalem</span>
      </div>
      <div class="project-summary-amount">${formatMoney(lowestQuote)}</div>
      <div class="project-summary-meta">
        <span>${projectVolume.toFixed(3)} m3 toplam</span>
        <span>${bestSupplier ? bestSupplier.supplier.name : 'Satıcı yok'}</span>
      </div>
    `;

    card.appendChild(summaryCard);

    const metaRow = document.createElement('div');
    metaRow.className = 'meta';
    metaRow.innerHTML = `
      <strong>${project.name}</strong>
      <span>${project.materials.length} ahşap • ${projectVolume.toFixed(3)} m3</span>
    `;
    card.appendChild(metaRow);

    const amount = document.createElement('div');
    amount.className = 'amount';
    amount.textContent = formatMoney(lowestQuote);
    card.appendChild(amount);

    const actionsRow = document.createElement('div');
    actionsRow.style.gridColumn = '1 / -1';
    actionsRow.style.display = 'flex';
    actionsRow.style.gap = '8px';
    actionsRow.style.justifyContent = 'space-between';

    const selectBtn = document.createElement('button');
    selectBtn.type = 'button';
    selectBtn.className = 'secondary-btn';
    selectBtn.style.flex = '1';
    selectBtn.textContent = isSelected ? 'Seçili' : 'Seç';
    selectBtn.addEventListener('click', () => {
      state.selectedProjectId = project.id;
      renderProjects();
    });

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'secondary-btn';
    copyBtn.style.flex = '1';
    copyBtn.textContent = 'Kopyala';
    copyBtn.addEventListener('click', () => copyProject(project.id));

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'secondary-btn';
    deleteBtn.style.flex = '1';
    deleteBtn.textContent = 'Sil';
    deleteBtn.addEventListener('click', () => deleteProject(project.id));

    actionsRow.append(selectBtn, copyBtn, deleteBtn);
    card.appendChild(actionsRow);

    if (isSelected) {
      const materialBox = document.createElement('div');
      materialBox.style.display = 'grid';
      materialBox.style.gap = '8px';
      materialBox.style.marginTop = '10px';
      materialBox.style.gridColumn = '1 / -1';

      const supplierTotals = state.suppliers.map((supplier) => ({
        supplier,
        total: getProjectTotalBySupplier(project, supplier),
      }));

      const totalsRow = document.createElement('div');
      totalsRow.style.display = 'grid';
      totalsRow.style.gap = '6px';
      totalsRow.innerHTML = supplierTotals.map(({ supplier, total }) => `
        <div style="display:flex;justify-content:space-between;gap:8px;padding:6px 8px;border-radius:10px;background:${bestSupplier && bestSupplier.supplier.id === supplier.id ? 'rgba(46,141,95,0.12)' : 'rgba(143,91,36,0.06)'};border:${bestSupplier && bestSupplier.supplier.id === supplier.id ? '1px solid rgba(46,141,95,0.25)' : '1px solid transparent'};">
          <span style="color:var(--muted);font-size:0.74rem;">${supplier.name}</span>
          <strong style="font-size:0.74rem;">${formatMoney(total)}</strong>
        </div>
      `).join('');
      materialBox.appendChild(totalsRow);

      project.materials.forEach((material) => {
        const materialRow = document.createElement('div');
        materialRow.style.display = 'grid';
        materialRow.style.gap = '8px';
        materialRow.style.padding = '10px';
        materialRow.style.border = '1px solid var(--line)';
        materialRow.style.borderRadius = '12px';

        const materialSupplierRows = state.suppliers.map((supplier) => {
          const cost = getProjectMaterialCost(material, supplier);
          return `
            <div style="display:flex;justify-content:space-between;gap:10px;padding:6px 8px;border-radius:10px;background:rgba(143,91,36,0.05);">
              <span style="color:var(--muted);font-size:0.72rem;">${supplier.name}</span>
              <strong style="font-size:0.72rem;">${formatMoney(cost)}</strong>
            </div>
          `;
        }).join('');

        materialRow.innerHTML = `
          <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;">
            <div class="meta" style="min-width:0;">
              <strong style="font-size:0.82rem;">${material.name}</strong>
              <span>${material.qty} adet • ${material.width}x${material.height} cm • ${material.length} m</span>
            </div>
          </div>
          <div style="display:grid;gap:4px;">${materialSupplierRows}</div>
          <div style="display:flex;gap:8px;justify-content:flex-end;">
            <button class="secondary-btn" type="button" data-action="edit-material" data-project-id="${project.id}" data-material-id="${material.id}">Düzenle</button>
            <button class="secondary-btn" type="button" data-action="delete-material" data-project-id="${project.id}" data-material-id="${material.id}">Sil</button>
          </div>
        `;

        materialRow.querySelector('[data-action="edit-material"]').addEventListener('click', () => startMaterialEdit(project.id, material));
        materialRow.querySelector('[data-action="delete-material"]').addEventListener('click', () => deleteMaterial(project.id, material.id));
        materialBox.appendChild(materialRow);
      });

      card.appendChild(materialBox);
    }

    projectList.appendChild(card);
  });
}

function startMaterialEdit(projectId, material) {
  const project = state.projects.find((item) => item.id === projectId);
  if (!project) return;

  state.selectedProjectId = projectId;
  editingMaterialId = material.id;
  projectMaterialNameInput.value = material.name;
  projectQtyInput.value = material.qty;
  projectWidthInput.value = material.width;
  projectHeightInput.value = material.height;
  projectLengthInput.value = material.length;

  const standardSizeKey = ['10x10x2', '5x10x2', '5x5x2', '2x8x2'].find((key) => {
    const preset = {
      '10x10x2': { width: 10, height: 10, length: 2 },
      '5x10x2': { width: 5, height: 10, length: 2 },
      '5x5x2': { width: 5, height: 5, length: 2 },
      '2x8x2': { width: 2, height: 8, length: 2 },
    }[key];
    return preset && Number(material.width) === preset.width && Number(material.height) === preset.height && Number(material.length) === preset.length;
  }) || 'custom';

  applyProjectSize(standardSizeKey);
  addProjectMaterialBtn.textContent = 'Malzemeyi güncelle';
  renderProjects();
  showTab('project');
}

function deleteMaterial(projectId, materialId) {
  const project = state.projects.find((item) => item.id === projectId);
  if (!project) return;

  project.materials = project.materials.filter((material) => material.id !== materialId);
  if (editingMaterialId === materialId) {
    resetProjectForm();
  }
  saveState();
  renderProjects();
}

function copyProject(projectId) {
  const source = state.projects.find((project) => project.id === projectId);
  if (!source) return;

  const copied = {
    id: `project-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: `${source.name} Kopya`,
    materials: source.materials.map((material) => ({ ...material, id: `material-${Date.now()}-${Math.random().toString(16).slice(2)}` })),
  };

  state.projects.unshift(copied);
  state.selectedProjectId = copied.id;
  saveState();
  renderProjects();
}

function deleteProject(projectId) {
  state.projects = state.projects.filter((project) => project.id !== projectId);
  if (state.selectedProjectId === projectId) {
    state.selectedProjectId = state.projects[0]?.id || null;
  }
  saveState();
  renderProjects();
}

function createProject() {
  const name = projectNameInput.value.trim();
  if (!name) {
    alert('Lütfen proje adı yazın.');
    return;
  }

  const project = {
    id: `project-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name,
    materials: [],
  };

  state.projects.unshift(project);
  state.selectedProjectId = project.id;
  projectNameInput.value = '';
  saveState();
  renderProjects();
  showTab('project');
}

function addProjectMaterial() {
  const name = projectMaterialNameInput.value.trim() || `${Number(projectWidthInput.value) || 10}x${Number(projectHeightInput.value) || 10} cm / ${Number(projectLengthInput.value) || 2} m`;
  const width = Number(projectWidthInput.value) || 0;
  const height = Number(projectHeightInput.value) || 0;
  const length = Number(projectLengthInput.value) || 0;
  const qty = Number(projectQtyInput.value) || 1;

  if (!width || !height || !length) {
    alert('En, boy ve uzunluk alanlarını doldurun.');
    return;
  }

  const project = state.projects.find((item) => item.id === state.selectedProjectId) || state.projects[0];
  if (!project) {
    alert('Önce bir proje oluşturun.');
    return;
  }

  if (editingMaterialId) {
    const target = project.materials.find((material) => material.id === editingMaterialId);
    if (target) {
      target.name = name;
      target.width = width;
      target.height = height;
      target.length = length;
      target.qty = qty;
    }
  } else {
    project.materials.push({
      id: `material-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name,
      width,
      height,
      length,
      qty,
    });
  }

  resetProjectForm();
  saveState();
  renderProjects();
  showTab('project');
}

function addToCart() {
  const width = Number(widthInput.value);
  const height = Number(heightInput.value);
  const length = Number(lengthSelect.value);
  const qty = Number(qtyInput.value);

  if (!width || !height || !length || !qty) {
    alert('Lütfen en, boy, uzunluk ve adet alanlarını doldurun.');
    return;
  }

  const product = getProductData(width, height, length);
  const supplier = getActiveSupplier();
  const item = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    label: product.label,
    width,
    height,
    length,
    qty,
    unitPrice: product.unitPrice,
    supplierId: supplier ? supplier.id : null,
    supplierName: supplier ? supplier.name : 'Firma yok',
  };

  state.cart.push(item);
  saveState();
  renderCart();
  showTab('cart');
}

function editCartItem(item) {
  widthInput.value = item.width;
  heightInput.value = item.height;
  lengthSelect.value = String(item.length);
  qtyInput.value = item.qty;
  if (item.supplierId) {
    state.selectedSupplierId = item.supplierId;
  }
  state.cart = state.cart.filter((entry) => entry.id !== item.id);
  updatePreview();
  saveState();
  renderCart();
  showTab('calculator');
}

function removeCartItem(id) {
  state.cart = state.cart.filter((item) => item.id !== id);
  saveState();
  renderCart();
}

function renderSupplierList() {
  supplierList.innerHTML = '';

  if (!state.suppliers.length) {
    supplierList.innerHTML = '<div class="empty-state">Henüz kayıtlı firma yok.</div>';
    return;
  }

  state.suppliers.forEach((supplier) => {
    const row = document.createElement('div');
    row.className = `supplier-item ${supplier.id === state.selectedSupplierId ? 'is-active' : ''}`;
    row.innerHTML = `
      <div class="supplier-main">
        <strong>${supplier.name}</strong>
        <span>${formatMoney(supplier.price)} / m3</span>
      </div>
      <div class="supplier-actions">
        <button class="supplier-select-btn" type="button" data-id="${supplier.id}">${supplier.id === state.selectedSupplierId ? 'Seçili' : 'Seç'}</button>
        <button class="supplier-delete-btn" type="button" data-id="${supplier.id}" ${state.suppliers.length === 1 ? 'disabled' : ''}>Sil</button>
      </div>
    `;

    row.querySelector('.supplier-select-btn').addEventListener('click', () => {
      state.selectedSupplierId = supplier.id;
      saveState();
      renderSettings();
      updatePreview();
    });

    row.querySelector('.supplier-delete-btn').addEventListener('click', () => {
      if (state.suppliers.length === 1) return;
      state.suppliers = state.suppliers.filter((entry) => entry.id !== supplier.id);
      if (state.selectedSupplierId === supplier.id) {
        state.selectedSupplierId = state.suppliers[0].id;
      }
      saveState();
      renderSettings();
      updatePreview();
    });

    supplierList.appendChild(row);
  });
}

function updateM3Calculator() {
  const width = Number(m3WidthInput.value) || 0;
  const height = Number(m3HeightInput.value) || 0;
  const length = Number(m3LengthInput.value) || 0;
  const piecePrice = Number(m3UnitPriceInput.value) || 0;
  const volume = (width / 100) * (height / 100) * length;

  const rate = piecePrice > 0 && volume > 0 ? piecePrice / volume : 0;
  const total = piecePrice;

  m3VolumeText.textContent = `${volume.toFixed(3)} m3`;
  m3TotalText.textContent = formatMoney(total);
  m3PriceText.textContent = formatMoney(rate);
  m3RateBadge.textContent = piecePrice > 0 && volume > 0
    ? `${formatMoney(piecePrice)} ÷ ${volume.toFixed(3)} m3 = ${formatMoney(rate)} / m3`
    : 'Fiyat girdiğinde m3 eşdeğeri hesaplanır';
}

function renderSettings() {
  const activeSupplier = getActiveSupplier();
  if (activeSupplier) {
    state.m3Price = Number(activeSupplier.price) || 0;
  }
  m3PriceInput.value = String(Number(activeSupplier ? activeSupplier.price : state.defaultM3Price || state.m3Price || 1800));
  defaultM3PriceInput.value = String(Number(state.defaultM3Price || 1800));
  currencySelect.value = state.currency;
  taxToggle.checked = state.includeTax;
  ratio10x10.value = state.customRatios['10x10'];
  ratio5x10.value = state.customRatios['5x10'];
  ratio5x5.value = state.customRatios['5x5'];
  ratio2x8.value = state.customRatios['2x8'];
  renderSupplierList();
  packageBadge.textContent = activeSupplier ? `${activeSupplier.name}: ${formatMoney(activeSupplier.price)} / m3` : 'Firma seçilmedi';
  document.body.classList.toggle('dark', state.theme === 'dark');
  themeToggle.textContent = state.theme === 'dark' ? '🌙' : '☀️';
  updateM3Calculator();
}

function showTab(name) {
  document.querySelectorAll('.view').forEach((view) => {
    view.classList.toggle('is-active', view.id === `${name}View`);
  });
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.classList.toggle('is-active', tab.dataset.tab === name);
  });
}

function attachEvents() {
  addToCartBtn.addEventListener('click', addToCart);
  [widthInput, heightInput, qtyInput].forEach((input) => input.addEventListener('input', updatePreview));
  [m3WidthInput, m3HeightInput, m3LengthInput, m3UnitPriceInput].forEach((input) => input.addEventListener('input', updateM3Calculator));
  lengthSelect.addEventListener('change', updatePreview);

  document.querySelectorAll('.tab').forEach((button) => {
    button.addEventListener('click', () => showTab(button.dataset.tab));
  });

  document.querySelectorAll('.mode-btn').forEach((button) => {
    button.addEventListener('click', () => {
      state.mode = button.dataset.mode;
      document.querySelectorAll('.mode-btn').forEach((btn) => btn.classList.toggle('is-active', btn.dataset.mode === state.mode));
      updatePreview();
      saveState();
    });
  });

  themeToggle.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    renderSettings();
    saveState();
  });

  m3PriceInput.addEventListener('input', () => {
    const activeSupplier = getActiveSupplier();
    if (!activeSupplier) return;
    activeSupplier.price = Number(m3PriceInput.value) || 0;
    state.m3Price = activeSupplier.price;
    saveState();
    renderSettings();
    updatePreview();
  });

  defaultM3PriceInput.addEventListener('input', () => {
    state.defaultM3Price = Number(defaultM3PriceInput.value) || 1800;
    saveState();
    renderSettings();
    updatePreview();
  });

  resetM3PriceBtn.addEventListener('click', () => {
    const activeSupplier = getActiveSupplier();
    if (!activeSupplier) return;
    activeSupplier.price = Number(state.defaultM3Price) || 1800;
    state.m3Price = activeSupplier.price;
    saveState();
    renderSettings();
    updatePreview();
  });

  addSupplierBtn.addEventListener('click', () => {
    const name = supplierNameInput.value.trim();
    const price = Number(supplierPriceInput.value);
    if (!name || !price) {
      alert('Firma adı ve m3 fiyatı zorunludur.');
      return;
    }

    const supplier = {
      id: `supplier-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name,
      price,
      active: false,
    };

    state.suppliers.push(supplier);
    state.selectedSupplierId = supplier.id;
    state.defaultM3Price = price;
    state.m3Price = price;
    saveState();
    supplierNameInput.value = '';
    supplierPriceInput.value = '';
    renderSettings();
    updatePreview();
  });

  currencySelect.addEventListener('change', () => {
    state.currency = currencySelect.value;
    saveState();
    renderCart();
    renderProjects();
    updatePreview();
  });

  projectCreateBtn.addEventListener('click', createProject);
  addProjectMaterialBtn.addEventListener('click', addProjectMaterial);
  projectSizeButtons.forEach((button) => {
    button.addEventListener('click', () => applyProjectSize(button.dataset.projectSize));
  });

  taxToggle.addEventListener('change', () => {
    state.includeTax = taxToggle.checked;
    saveState();
  });

  [ratio10x10, ratio5x10, ratio5x5, ratio2x8].forEach((input) => {
    input.addEventListener('input', () => {
      state.customRatios['10x10'] = Number(ratio10x10.value) || 1;
      state.customRatios['5x10'] = Number(ratio5x10.value) || 0.5;
      state.customRatios['5x5'] = Number(ratio5x5.value) || 0.25;
      state.customRatios['2x8'] = Number(ratio2x8.value) || 0.15;
      saveState();
      updatePreview();
    });
  });
}

renderStandardSizes();
renderSettings();
attachEvents();
updatePreview();
updateM3Calculator();
renderCart();
renderProjects();
showTab('calculator');
