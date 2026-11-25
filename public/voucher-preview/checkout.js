import {voucherPage} from './views.js';

class CustomerMessage extends Error {}
const main=document.querySelector('#main');
const currency=value=>new Intl.NumberFormat('pl-PL',{style:'currency',currency:'PLN',maximumFractionDigits:0}).format(value);
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let offers=[],selectedOffer,configuration,busy=false,idempotencyKey=crypto.randomUUID(),pollTimer,downloadUrl;
const receipt=new URLSearchParams(location.hash.slice(1));
const receiptId=receipt.get('order')||'';
const receiptAccess=receipt.get('access')||'';
const headers=()=>({Authorization:`Bearer ${receiptAccess}`});

function statusLabel(){return configuration?.window==='before'?'Sprzedaż od 27 listopada':configuration?.window==='after'?'Promocja zakończona':'Sprzedaż chwilowo niedostępna';}
function updateSummary(){
  document.querySelector('[data-summary-value]').textContent=currency(selectedOffer.value);
  document.querySelector('[data-summary-bonus]').textContent=currency(selectedOffer.bonus);
  document.querySelector('[data-summary-price]').textContent=currency(selectedOffer.price);
  const button=document.querySelector('[data-buy-button]');
  button.disabled=busy||!configuration.available;
  document.querySelectorAll('#purchase-form input').forEach(input=>input.disabled=busy);
  button.textContent=busy?'Przygotowujemy bezpieczną płatność…':configuration.available?`Kupuję i płacę ${currency(selectedOffer.price)}`:statusLabel();
}
function fieldError(id,message){const field=document.getElementById(id);const error=document.getElementById(id+'-error');field?.setAttribute('aria-invalid',message?'true':'false');if(error)error.textContent=message;return message?field:null;}
function validNip(value){if(!/^\d{10}$/.test(value))return false;const digits=[...value].map(Number);return [6,5,7,2,3,4,5,6,7].reduce((sum,w,i)=>sum+w*digits[i],0)%11===digits[9];}

async function shop(){
  main.innerHTML='<section class="container confirmation" role="status"><h1>Twój dobry początek.</h1><p>Wczytujemy vouchery…</p></section>';
  try{
    const response=await fetch('/api/vouchers/config',{cache:'no-store'});
    if(!response.ok)throw new Error();
    configuration=await response.json();
    offers=configuration.offers.map(offer=>({value:offer.value,price:offer.cash/100,bonus:offer.bonus/100}));
    selectedOffer=offers.find(offer=>offer.value===1000)||offers[0];
    main.innerHTML=voucherPage(offers,selectedOffer,{preview:false});
    const form=document.querySelector('#purchase-form');
    const notice=document.createElement('p');notice.id='checkout-feedback';notice.className='field-error';notice.setAttribute('role','alert');
    document.querySelector('.summary').append(notice);
    if(!configuration.available){const info=document.createElement('p');info.className='sale-status';info.textContent=statusLabel();document.querySelector('.offer-section').prepend(info);}
    form.addEventListener('change',event=>{
      idempotencyKey=crypto.randomUUID();
      if(event.target.name==='voucherValue'){selectedOffer=offers.find(offer=>offer.value===Number(event.target.value));updateSummary();}
      if(event.target.name==='gift')document.querySelector('#gift-helper').textContent=event.target.value==='yes'?'Na voucherze zostawimy puste miejsce na imię. Możesz wpisać je odręcznie. Niespodzianka zostaje między nami.':'Voucher wyślemy do Ciebie. Nie musisz teraz wybierać nauczyciela ani terminów.';
    });
    form.addEventListener('submit',submit);
    updateSummary();
    if(location.hash==='#zakup')document.querySelector('#zakup').scrollIntoView();
  }catch{main.innerHTML='<section class="confirmation"><h1>Spróbujmy za chwilę.</h1><p>Nie udało się wczytać oferty. Odśwież stronę albo napisz na <a href="mailto:hello@unick-academy.pl">hello@unick-academy.pl</a>.</p><button class="button" type="button" id="reload-shop">Odśwież ofertę</button></section>';document.querySelector('#reload-shop').onclick=shop;}
}

async function submit(event){
  event.preventDefault();if(busy||!configuration.available)return;
  const name=document.querySelector('#buyer-name'),email=document.querySelector('#buyer-email'),terms=document.querySelector('#accept-terms');
  const errors=[fieldError('buyer-name',name.value.trim().length<2?'Wpisz imię i nazwisko kupującego.':''),fieldError('buyer-email',!email.value.trim()||!email.validity.valid?'Wpisz poprawny adres e-mail.':'')];
  document.querySelector('#terms-error').textContent=terms.checked?'':'Zaznacz akceptację regulaminu, aby przejść dalej.';terms.setAttribute('aria-invalid',String(!terms.checked));if(!terms.checked)errors.push(terms);
  const taxId=document.querySelector('#invoice-tax-id').value.replace(/[\s-]/g,''),company=document.querySelector('#invoice-name').value.trim(),address=document.querySelector('#invoice-address').value.trim();
  const invoice=taxId||company||address?{taxId,name:company,address}:undefined;
  const invoiceError=invoice&&(!validNip(taxId)||company.length<2||address.length<5);
  document.querySelector('#invoice-error').textContent=invoiceError?'Sprawdź NIP, nazwę i pełny adres firmy.':'';
  if(invoiceError){document.querySelector('.invoice-details').open=true;errors.push(document.querySelector('#invoice-tax-id'));}
  const firstError=errors.find(Boolean);if(firstError){firstError.focus();return;}
  const feedback=document.querySelector('#checkout-feedback');feedback.textContent='';busy=true;updateSummary();
  try{
    const response=await fetch('/api/vouchers/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({value:selectedOffer.value,buyerName:name.value.trim(),buyerEmail:email.value.trim(),gift:document.querySelector('[name=gift]:checked').value==='yes',terms:true,idempotencyKey,...(invoice?{invoice}:{})})});
    const data=await response.json();if(!response.ok)throw new CustomerMessage(data.error||'Nie udało się przygotować płatności. Spróbuj za chwilę.');
    if(data.confirmationUrl){location.assign(data.confirmationUrl);return;}
    const checkout=new URL(data.checkoutUrl);
    if(checkout.protocol!=='https:'||!['secure.payu.com','secure.snd.payu.com'].includes(checkout.hostname))throw new Error('Nie udało się otworzyć płatności. Napisz do nas.');
    location.assign(checkout.href);
  }catch(error){feedback.textContent=error instanceof CustomerMessage?error.message:'Połączenie nie powiodło się. Spróbuj ponownie za chwilę.';busy=false;updateSummary();}
}

async function confirmation(attempt=0){
  if(!receiptId||!receiptAccess){main.innerHTML='<section class="confirmation"><h1>Sprawdź swój e-mail.</h1><p>Link do tego zamówienia nie jest kompletny. Po opłaceniu wyślemy voucher na adres podany podczas zakupu.</p><a class="button" href="/voucher">Wróć do voucherów</a></section>';return;}
  if(attempt===0)main.innerHTML='<section class="confirmation" role="status"><h1>Sprawdzamy Twoją płatność.</h1><p>Potrzebujemy potwierdzenia z PayU. Możesz zostawić tę stronę otwartą.</p></section>';
  try{
    const response=await fetch(`/api/vouchers/orders/${encodeURIComponent(receiptId)}`,{headers:headers(),cache:'no-store'});
    const order=await response.json();if(!response.ok)throw new CustomerMessage(order.error);
    if(order.status==='paid'){
      main.innerHTML=`<section class="confirmation"><div class="success-seal" aria-hidden="true">✓</div><p class="eyebrow">PŁATNOŚĆ POTWIERDZONA</p><h1>Dobry prezent.<br><em>Dobry początek.</em></h1><p class="lead">Twój voucher ma wartość <strong>${currency(order.value)}</strong>. ${order.emailSent?'Wysłaliśmy go również na e-mail podany podczas zakupu.':'Przygotowujemy wiadomość z voucherem. Możesz już pobrać go tutaj.'}</p><div class="confirmation-card" id="voucher-image"><p>Przygotowujemy grafikę…</p></div><p class="voucher-code"><strong>${escape(order.code)}</strong></p><p>Ważny do ${escape(order.expiresOn.split('-').reverse().join('.'))}</p><button class="button" type="button" id="download-paid-voucher" disabled>Pobierz voucher</button><p class="fine-print">${currency(order.price)} wpłaty + ${currency(order.bonus)} bonusu = ${currency(order.value)} na zajęcia.</p><p>Przekaż kod szkole przy ustalaniu zajęć. Po weryfikacji przypiszemy wartość do właściwego konta w ActiveNow.</p><p class="fine-print">Numer zamówienia: ${escape(order.id)}</p><a class="inline-link" href="mailto:hello@unick-academy.pl">Potrzebuję pomocy</a></section>`;
      try{const image=await fetch(`/api/vouchers/orders/${encodeURIComponent(receiptId)}/download`,{headers:headers(),cache:'no-store'});if(!image.ok)throw new Error();downloadUrl=URL.createObjectURL(await image.blob());const element=document.createElement('img');element.className='email-art';element.src=downloadUrl;element.alt=`Voucher ${order.value} zł z kodem ${order.code} i pustym miejscem na imię`;document.querySelector('#voucher-image').replaceChildren(element);const button=document.querySelector('#download-paid-voucher');button.disabled=false;button.onclick=()=>{const link=document.createElement('a');link.href=downloadUrl;link.download=`uNick-Academy-voucher-${order.value}.png`;link.click();};}catch{document.querySelector('#voucher-image').textContent='Grafika jest dostępna w e-mailu. Jeśli nie dotrze, napisz do nas.';}
      return;
    }
    if(order.status==='canceled'||order.status==='refunded'){main.innerHTML='<section class="confirmation"><h1>Ta płatność nie daje aktywnego vouchera.</h1><p>Zamówienie zostało anulowane lub zwrócone. Jeśli to niespodziewane, napisz na hello@unick-academy.pl.</p><a class="button" href="/voucher">Wróć do voucherów</a></section>';return;}
    if(attempt<40){pollTimer=setTimeout(()=>confirmation(attempt+1),3000);return;}
    throw new CustomerMessage('Potwierdzenie z PayU jeszcze nie dotarło. Nie płać drugi raz. Sprawdź ponownie za chwilę lub napisz do nas.');
  }catch(error){main.innerHTML=`<section class="confirmation"><h1>Sprawdźmy to ponownie.</h1><p>${escape(error instanceof CustomerMessage?error.message:'Nie udało się sprawdzić płatności. Spróbuj ponownie za chwilę.')}</p><button class="button" type="button" id="retry-payment-status">Sprawdź ponownie</button><p><a href="mailto:hello@unick-academy.pl">hello@unick-academy.pl</a></p></section>`;document.querySelector('#retry-payment-status').onclick=()=>confirmation();}
}
window.addEventListener('pagehide',()=>{clearTimeout(pollTimer);if(downloadUrl)URL.revokeObjectURL(downloadUrl);});
if(location.pathname.replace(/\/$/,'')==='/voucher/potwierdzenie')confirmation();else shop();
