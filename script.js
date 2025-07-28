// Cache DOM elements for better performance
const DOM = {
    form: document.querySelector('.add-item-section'),
    clearBtn: document.querySelector('.btn-clear'),
    ul: document.querySelector('.item-list'),
    filterInput: document.querySelector('#filter'),
    deleteBtn: document.querySelector('.btn-confirm'),
    cancelBtn: document.querySelector('.btn-cancel'),
    filterBtn: document.querySelector('.filter-buttons'),
    itemInput: document.querySelector('.item-input'),
    quantityInput: document.querySelector('.quantity-input'),
    quantityUnit: document.querySelector('.quantity-unit'),
    categorySelector: document.querySelector('.category-selector'),
    addBtn: document.querySelector('.add-btn'),
    filterSection: document.querySelector('.filter'),
    clearSection: document.querySelector('#clear'),
    emptyMessage: document.getElementById('empty-message'),
    confirmModal: document.querySelector('.confirm'),
    overlay: document.querySelector('.overlay'),
    duplicateMsg: document.getElementById('duplicate-msg')
};

// Application state
const appState = {
    isEditMode: false,
    currentItem: null,
    items: new Map() // Use Map for O(1) lookups
};

// Item constructor
function Item(name, quantity, category) {
    this.name = name;
    this.quantity = quantity;
    this.category = category === 'Category' || !category ? 'Other' : category;
}

// Utility functions
const utils = {
    hide() {
        DOM.confirmModal.classList.remove('visible');
        DOM.overlay.style.visibility = 'hidden';
        DOM.overlay.style.opacity = '0';
    },

    // Optimized duplicate check using Map
    checkDuplicateItems(input) {
        const normalizedInput = input.toLowerCase().trim();
        return appState.items.has(normalizedInput);
    },

    showDuplicateMessage() {
        DOM.duplicateMsg.classList.add('show');
        setTimeout(() => DOM.duplicateMsg.classList.remove('show'), 2000);
    },

    // Debounced filter function for better performance
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    parseQuantity(text) {
        const clean = text.replace("Qty.", "").trim();
        const match = clean.match(/^(\d+(?:\.\d+)?)([a-zA-Z]+)$/);
        return match ? [match[1], match[2]] : [null, null];
    },

    // Optimized DOM creation using template literals and fragment
    createItemElement(item) {
        const template = `
            <span>${item.name}<small class="item-note">Qty. ${item.quantity}</small></span>
            <div class="category-tag">${item.category}</div>
            <div class="actions">
                <button class="edit" title="Edit item">${document.getElementById('edit-icon').outerHTML}</button>
                <button class="delete" title="Delete item">${document.getElementById('delete-icon').outerHTML}</button>
            </div>
        `;
        
        const li = document.createElement('li');
        li.className = 'item';
        li.innerHTML = template;
        return li;
    }
};

// Main application functions
const app = {
    updateUIState() {
        const hasItems = DOM.ul.childElementCount > 0;
        
        // Batch DOM updates
        const updates = [
            [DOM.filterSection, 'style.display', hasItems ? 'block' : 'none'],
            [DOM.clearSection, 'style.display', hasItems ? 'block' : 'none'],
            [DOM.emptyMessage, 'classList', hasItems ? 'add' : 'remove', 'hidden']
        ];
        
        updates.forEach(([element, property, value, action]) => {
            if (property.includes('.')) {
                const [obj, prop] = property.split('.');
                element[obj][prop] = value;
            } else if (action) {
                element[property][action](value);
            }
        });

        // Reset filter buttons
        if (!hasItems) {
            document.querySelectorAll('.filter-buttons button').forEach(btn => {
                btn.classList.toggle('active', btn.textContent === 'All');
            });
        }
    },

    clearItems() {
        // Use DocumentFragment for batch removal
        const items = [...document.querySelectorAll('.item')];
        items.forEach(item => item.remove());
        
        localStorage.removeItem('items');
        appState.items.clear();
        this.updateUIState();
        this.exitEditMode();
    },

    addItem() {
        const name = DOM.itemInput.value.trim();
        const quantity = DOM.quantityInput.value + DOM.quantityUnit.value;
        const category = DOM.categorySelector.value;
        
        if (!name) return;

        const item = new Item(name, quantity, category);
        const normalizedName = name.toLowerCase();

        if (appState.isEditMode) {
            const oldName = appState.currentItem.firstElementChild.firstChild.textContent.trim().toLowerCase();
            appState.items.delete(oldName);
            appState.currentItem.remove();
        } else {
            if (utils.checkDuplicateItems(name)) {
                utils.showDuplicateMessage();
                return;
            }
        }

        this.addItemToDOM(item);
        this.addItemToStorage(item);
        appState.items.set(normalizedName, item);
        this.resetForm();
    },

    addItemToDOM(item) {
        const li = utils.createItemElement(item);
        DOM.ul.appendChild(li);

        // Optimized animation
        li.classList.add('entering');
        requestAnimationFrame(() => {
            li.classList.remove('entering');
        });

        this.updateUIState();
    },

    addItemToStorage(item) {
        let itemsArray = JSON.parse(localStorage.getItem('items') || '[]');
        itemsArray.push(item);
        localStorage.setItem('items', JSON.stringify(itemsArray));
    },

    removeItemFromStorage(removedItem) {
        let itemsArray = JSON.parse(localStorage.getItem('items') || '[]');
        itemsArray = itemsArray.filter(item => item.name !== removedItem);
        localStorage.setItem('items', JSON.stringify(itemsArray));
    },

    loadItems() {
        const store = localStorage.getItem('items');
        if (store) {
            const items = JSON.parse(store);
            // Use document fragment for batch insertion
            const fragment = document.createDocumentFragment();
            
            items.forEach(item => {
                const li = utils.createItemElement(item);
                fragment.appendChild(li);
                appState.items.set(item.name.toLowerCase(), item);
            });
            
            DOM.ul.appendChild(fragment);
            this.updateUIState();
        }
    },

    // Optimized filter with early exit and batch updates
    filter() {
        const items = DOM.ul.children;
        const value = DOM.filterInput.value.toLowerCase();
        const activeCategory = document.querySelector('.filter-buttons button.active')?.textContent.trim() || 'All';
        
        // Use array methods for better performance
        Array.from(items).forEach(item => {
            const itemName = item.firstElementChild.childNodes[0].textContent.toLowerCase();
            const itemCategory = item.querySelector('.category-tag').textContent.trim();
            const matchesCategory = activeCategory === 'All' || itemCategory === activeCategory;
            const matchesFilter = itemName.includes(value);
            
            item.style.display = (matchesCategory && matchesFilter) ? 'flex' : 'none';
        });
    },

    onEditMode(button) {
        if (appState.currentItem) {
            appState.currentItem.style.pointerEvents = 'auto';
        }

        appState.isEditMode = true;
        appState.currentItem = button.closest('li');
        
        // Clear previous edit modes
        document.querySelectorAll('.item').forEach(i => i.classList.remove('edit-mode'));
        
        appState.currentItem.style.pointerEvents = 'none';
        appState.currentItem.classList.add('edit-mode');
        
        // Populate form
        DOM.itemInput.value = appState.currentItem.firstElementChild.firstChild.textContent.trim();
        const quantityText = appState.currentItem.querySelector('.item-note')?.textContent;
        const [qty, unit] = utils.parseQuantity(quantityText);
        
        DOM.quantityInput.value = qty || '0';
        DOM.quantityUnit.value = unit || 'Pcs';
        DOM.categorySelector.value = appState.currentItem.querySelector('.category-tag').textContent.trim();
        
        DOM.addBtn.innerHTML = '<span style="font-size: 14px;">✏️</span> Update Item';
        DOM.addBtn.style.backgroundColor = '#3b4cba';
    },

    exitEditMode() {
        appState.isEditMode = false;
        appState.currentItem?.classList.remove('edit-mode');
        appState.currentItem = null;
        
        DOM.addBtn.innerHTML = '<span class="icon-plus">+</span> Add Item';
        DOM.addBtn.style.backgroundColor = '#4CAF50';
        this.resetForm();
    },

    resetForm() {
        DOM.itemInput.value = '';
        DOM.quantityInput.value = '0';
        DOM.categorySelector.value = 'Category';
    },

    handleItemClick(event) {
        const deleteBtn = event.target.closest('.delete');
        const editBtn = event.target.closest('.edit');
        
        if (deleteBtn) {
            this.removeFromDOM(deleteBtn);
        } else if (editBtn) {
            this.onEditMode(editBtn);
        }
    },

    removeFromDOM(button) {
        const li = button.closest('li');
        const itemName = li.querySelector('span').firstChild.textContent.trim();
        
        li.remove();
        appState.items.delete(itemName.toLowerCase());
        this.removeItemFromStorage(itemName);
        this.updateUIState();
    },

    handleCategoryFilter(event) {
        if (event.target.tagName !== 'BUTTON' || DOM.ul.childElementCount === 0) return;

        // Update active state
        document.querySelectorAll('.filter-buttons button').forEach(btn =>
            btn.classList.remove('active')
        );
        event.target.classList.add('active');

        // Apply filter
        this.filter();
    }
};

// Event listeners with optimized handlers
DOM.clearBtn.addEventListener('click', () => {
    DOM.confirmModal.classList.add('visible');
    DOM.overlay.style.visibility = 'visible';
    DOM.overlay.style.opacity = '1';
});

DOM.deleteBtn.addEventListener('click', () => {
    app.clearItems();
    utils.hide();
});

DOM.cancelBtn.addEventListener('click', utils.hide);

DOM.form.addEventListener('submit', (event) => {
    event.preventDefault();
    app.addItem();
    if (appState.isEditMode) {
        app.exitEditMode();
    }
});

// Debounced filter for better performance
DOM.filterInput.addEventListener('input', utils.debounce(() => app.filter(), 150));

DOM.filterBtn.addEventListener('click', (event) => app.handleCategoryFilter(event));

// Event delegation for better performance
DOM.ul.addEventListener('click', (event) => app.handleItemClick(event));

// Initialize app
app.updateUIState();
app.loadItems();
