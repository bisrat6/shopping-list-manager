const formBtn=document.querySelector('.add-item-section');
const clearBtn=document.querySelector('.btn-clear');
const ul=document.querySelector('.item-list');
const filterInput=document.querySelector('#filter');
const deleteBtn=document.querySelector('.btn-confirm');
const cancelBtn=document.querySelector('.btn-cancel');
const filterBtn=document.querySelector('.filter-buttons');
let isEditMode=false;
let currentItem=null;
function Item(name,quantity,category){
        this.name=name;
        this.quantity=quantity;
        this.category=category
}

function hide(){
document.querySelector('.confirm').classList.remove('visible');
document.querySelector('.overlay').style.visibility = 'hidden';
document.querySelector('.overlay').style.opacity = '0';
}

function checkDuplicateItems(input){
    const items=document.querySelectorAll('.item');

    for(let li of items){
        if(li.querySelector('span').firstChild.textContent.trim().toLowerCase()==input.toLowerCase())return true;
    }
    return false;
}

function showDuplicateMessage() {
  const msgBox = document.getElementById('duplicate-msg');
  msgBox.classList.add('show');

  setTimeout(() => {
    msgBox.classList.remove('show');
  }, 2000);
}

function isItem(){
    if(ul.childElementCount==0){
        document.querySelector(".filter").style.display="none";
        document.querySelector("#clear").style.display="none";
        document.getElementById('empty-message').classList.remove('hidden');
        document.querySelectorAll('.filter-buttons button').forEach(btn =>{
            if(btn.textContent=='All'){
                btn.classList.add('active');
            }else{
                btn.classList.remove('active')
            }
        });
    }
    else{
        document.querySelector(".filter").style.display="block";
        document.querySelector("#clear").style.display="block";
        document.getElementById('empty-message').classList.add('hidden');
    }
}



function clearItems(){
    const items=document.querySelectorAll('.item');
    items.forEach((item)=>{
        item.remove();
    });
    localStorage.removeItem('items'); 
    isItem();
    exitEditMode();
}

function addItem(event){

    const name=document.querySelector('.item-input').value.trim();
    const quantity=document.querySelector('.quantity-input').value + document.querySelector('.quantity-unit').value;
    const category=document.querySelector('.category-selector').value;
    const item=new Item(name,quantity,category);

    if (!name)return;

    
    if (isEditMode){
        removeItemsFromLocalStorage(currentItem.firstElementChild.firstChild.textContent.trim());
        currentItem.remove();
    }else{
        if(checkDuplicateItems(name)){
            showDuplicateMessage();
            return;
        }
    }

    addItemsToDOM(item);
    addItemsToLocalStorage(item);
    document.querySelector('.item-input').value="";
    document.querySelector('.quantity-input').value='0';
    document.querySelector('.category-selector').value='Category';
}
function addItemsToDOM(item){
    const ul=document.querySelector('.item-list');
    const li=document.createElement('li');
    const span=document.createElement('span');
    const div=document.createElement('div');
    const div2=document.createElement('div');
    const button=document.createElement('button');
    const button2=document.createElement('button');
    const small=document.createElement('small');
    const img1=document.createElement('img');
    const img2=document.createElement('img');
    const itemName=document.createTextNode(item.name);
    const itemQuantity=document.createTextNode(`Qty. ${item.quantity}`);

    item.category = (item.category === 'Category' || !item.category) ? 'Other' : item.category;

    const itemCategory= document.createTextNode(item.category);

    li.className='item';
    small.className='item-note';
    div.className='category-tag';
    div2.className='actions';
    button.className='edit';
    button2.className='delete';
    img1.src="./image/Group.svg";
    img2.src="./image/delete vector.svg";

    button.append(img1);
    button2.append(img2);
    div2.append(button);
    div2.append(button2);
    div.append(itemCategory);
    small.append(itemQuantity);
    span.append(itemName);
    span.append(small);

    li.append(span);
    li.append(div);
    li.append(div2);

    ul.append(li);

    li.classList.add('entering');
    setTimeout(() => li.classList.remove('entering'), 100);

    isItem();
}


function addItemsToLocalStorage(item){
    let itemsArray;
    if(localStorage.getItem('items')===null){
        itemsArray=[];
    }else{
        itemsArray=JSON.parse(localStorage.getItem('items'));
    }
    itemsArray.push(item);

    localStorage.setItem('items',JSON.stringify(itemsArray));
}


function removeItemsFromLocalStorage(removedItem){
    itemsArray=JSON.parse(localStorage.getItem('items'));
    itemsArray=itemsArray.filter(item=>item.name!==removedItem);
    localStorage.setItem('items',JSON.stringify(itemsArray));
}

function loadItems(){
    const store=localStorage.getItem('items');
    let tempStore;
    if(store){
        tempStore=JSON.parse(store);
        tempStore.forEach((item)=>addItemsToDOM(item));
    }
}
function filter(){
    const items=document.querySelectorAll('.item');
    const value=filterInput.value.toLowerCase();
    const buttons=document.querySelectorAll('.filter-buttons button');
    let state;
    buttons.forEach((button)=>{
        if(button.classList.contains('active')){
             state=button.textContent.trim();
        }
    });
    items.forEach((item)=>{
        let itemName=item.firstElementChild.childNodes[0].textContent.toLowerCase();
        if((item.querySelector('.category-tag').textContent.trim()===state || state=='All') && itemName.includes(value)){
             item.style.display='flex';
        }
        else item.style.display='none';
    });

}

function onEditMode(item){
    if(currentItem){
        currentItem.style["pointer-events"]='auto';
    }
    isEditMode=true;
    const inputBar=document.querySelector('.item-input');
    const quantityInputBar=document.querySelector('.quantity-input');
    const quantityUnitSelector=document.querySelector('.quantity-unit');
    const categorySelector=document.querySelector('.category-selector');




    document.querySelectorAll('.item').forEach(i=>{
        i.classList.remove('edit-mode');
    });

    
    currentItem=item.closest('li');
    currentItem.style["pointer-events"]='none';
    currentItem.classList.add('edit-mode');
    inputBar.value=currentItem.firstElementChild.firstChild.textContent.trim();
    const quantityText = currentItem.querySelector('.item-note')?.textContent;
    const quantity = parseQuantity(quantityText);
    quantityInputBar.value=quantity[0];
    quantityUnitSelector.value=quantity[1];
    categorySelector.value=currentItem.querySelector('.category-tag').textContent.trim();
    document.querySelector('.add-btn').innerHTML=`<i class="fa-solid fa-pen-to-square"></i> Update Item`;
    document.querySelector('.add-btn').style.backgroundColor='#3b4cba';
}



function parseQuantity(text) {

  const clean = text.replace("Qty.", "").trim();

  const match = clean.match(/^(\d+(?:\.\d+)?)([a-zA-Z]+)$/);

  if (match) {
    return [match[1], match[2]]; 
  } else {
    return [null, null];
  }
}

function exitEditMode(){
    isEditMode=false;
    document.querySelector('.add-btn').innerHTML=`<i class="fa-solid fa-plus"></i> Add Item`
    if(currentItem){
        currentItem.classList.remove('edit-mode');
        currentItem=null;
    }
    document.querySelector('.item-input').value="";
    document.querySelector('.add-btn').style.backgroundColor='#4CAF50';
}

function onClick(event){
    const deleteBtn=event.target.closest('.delete');
    const editBtn=event.target.closest('.edit');
    if(deleteBtn){
        removeFromDOM(deleteBtn);
    }else if(editBtn){
        onEditMode(editBtn);
    }
}

function removeFromDOM(item){
    const li=item.closest('li');
    li.remove();
    removeItemsFromLocalStorage(li.querySelector('span').firstChild.textContent);
    isItem();
}



function filterFun(event){
    if (event.target.tagName !== 'BUTTON' || ul.childElementCount==0) return;

  document.querySelectorAll('.filter-buttons button').forEach(btn =>
    btn.classList.remove('active')
  );

  event.target.classList.add('active');

  const selectedCategory = event.target.dataset.category;

  document.querySelectorAll('.item').forEach(item => {
    const tag = item.querySelector('.category-tag').textContent.trim().toLowerCase();
    if (selectedCategory === 'all' || tag === selectedCategory.toLowerCase()) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });
}


clearBtn.addEventListener('click',()=>{
    document.querySelector('.confirm').classList.add('visible');
  document.querySelector('.overlay').style.visibility = 'visible'; 
  document.querySelector('.overlay').style.opacity = '1';

});

deleteBtn.addEventListener('click',()=>{
    clearItems();
    hide();
});
cancelBtn.addEventListener('click',hide);

formBtn.addEventListener('submit',(event)=>{
    event.preventDefault();
    if(!isEditMode)addItem();
    else{
        // const input=document.querySelector('.item-input').value;
        addItem();
        exitEditMode();
    }
});
filterInput.addEventListener('input',filter);

filterBtn.addEventListener('click',filterFun);

ul.addEventListener('click',onClick);


isItem();
loadItems();
