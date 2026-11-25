import {voucherPage as renderVoucherPage} from './views.js';
import {createVoucherSvg, svgDataUrl, voucherPng, downloadAsset} from './voucher.js';

/** @typedef {{value:number, price:number, bonus:number}} Offer */
/** @type {Offer[]} */
const offers = [{value:250,price:239,bonus:11},{value:500,price:449,bonus:51},{value:1000,price:849,bonus:151},{value:5000,price:3999,bonus:1001}];
const currency = value => new Intl.NumberFormat('pl-PL',{style:'currency',currency:'PLN',maximumFractionDigits:0}).format(value);
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const main = document.querySelector('#main');
const welcomeModal = document.querySelector('#welcome-modal');
const paymentModal = document.querySelector('#payment-modal');
const termsModal = document.querySelector('#terms-modal');
let selectedOffer = offers[2];
let order = {offer:offers[2],name:'Anna',email:'twoj.adres@example.com',gift:true,code:'DEMO-UNICK-7K4M-9P2R',validUntil:'27.11.2027'};
let renderedPng = null;
let toastTimeout;

const icon = name => {
  const paths = {gift:'<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M2 8h20v4H2zM12 8v13M12 8H8a3 3 0 1 1 3-3Zm0 0h4a3 3 0 1 0-3-3Z"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',chat:'<path d="M21 11a9 9 0 0 1-9 9H4l-3 3v-9a9 9 0 1 1 20-3Z"/>',mail:'<rect x="2" y="4" width="20" height="16" rx="3"/><path d="m3 6 9 7 9-7"/>',spark:'<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"/>'};
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.gift}</svg>`;
};

function sessionGet(key) {try{return sessionStorage.getItem(key);}catch{return null;}}
function routePath(){return location.protocol==='file:'?(location.hash.startsWith('#/')?location.hash.slice(1):'/'):location.pathname+location.hash;}
function dismissWelcome() {welcomeModal.close();try{sessionStorage.setItem('unick-bf-mock-dismissed','1');}catch{}}
function showToast(message) {const toast=document.querySelector('#toast');toast.textContent=message;toast.classList.add('visible');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>toast.classList.remove('visible'),2400);}

function navigate(path, {replace=false} = {}) {
  if(welcomeModal.open)dismissWelcome();
  if(paymentModal.open)paymentModal.close();
  if(termsModal.open)termsModal.close();
  const nextUrl=location.protocol==='file:'?location.pathname+'#'+path:path;
  history[replace?'replaceState':'pushState']({},'',nextUrl);
  render();
  requestAnimationFrame(()=>{
    const anchorId=path.split('#')[1];
    const anchor=anchorId?document.getElementById(anchorId):null;
    if(anchor)anchor.scrollIntoView();else window.scrollTo(0,0);
    main.focus({preventScroll:true});
  });
}

function homePage() {
  return `<section class="container home-hero"><div><p class="eyebrow">UNICK ACADEMY</p><h1>Angielski to ludzie.<br /><em>Nie perfekcja.</em></h1><p class="lead">Konwersacyjny angielski dla dzieci, młodzieży i dorosłych — z native speakerami i międzynarodowymi lektorami. Stacjonarnie w Rumianku oraz online.</p><div class="button-row"><a class="button" href="/voucher" data-route>Podaruj dobre rozmowy</a><a class="button secondary" href="#jak-uczymy">Poznaj nasze lekcje</a></div></div><div class="home-photo"><img src="./assets/team.jpg" alt="Międzynarodowy zespół uNick Academy" width="650" height="650"/><img class="home-mascot" src="./assets/unickorn.png" alt="" aria-hidden="true" /></div></section><section id="jak-uczymy" class="container"><div class="home-highlights"><p class="eyebrow">PO SWOJEMU. Z LUDŹMI.</p><h2>Miejsce na prawdziwe rozmowy.</h2><p>Bez presji, że trzeba najpierw wiedzieć wszystko.</p><div class="home-highlights-grid"><div><h3>Mówisz od początku</h3><p>Używasz języka, żeby poznawać ludzi i mówić o swoim świecie.</p></div><div><h3>W swoim tempie</h3><p>Indywidualnie lub w małej grupie. Online albo u nas w Rumianku.</p></div><div><h3>Z ciekawości</h3><p>Różne akcenty, kultury i historie. Zawsze po ludzku.</p></div></div></div></section><button class="reopen-button" data-open-welcome>Podgląd okienka Black Friday</button>`;
}

function voucherPage() { return renderVoucherPage(offers, selectedOffer); }

function confirmationPage() {
  return `<section class="confirmation"><div class="success-seal" aria-hidden="true">✓</div><p class="eyebrow">ZAKUP PRZYKŁADOWY · ${order.gift?'NA PREZENT':'DLA SIEBIE'}</p><h1>Dobry prezent.<br /><em>Dobry początek.</em></h1><p class="lead">Tak będzie wyglądać potwierdzenie zakupu. Voucher o wartości <strong>${currency(order.offer.value)}</strong> z kodem i pustym miejscem na imię znajdziesz w przykładowej wiadomości poniżej.</p><div class="confirmation-card"><img class="email-art" src="${svgDataUrl(createVoucherSvg({value:order.offer.value,code:order.code,validUntil:order.validUntil}))}" alt="Wzór zakupionego vouchera z nieaktywnym kodem" width="1600" height="1000"/></div><div class="button-row"><a class="button" href="/voucher/email" data-route>Zobacz przykładowy e-mail</a><a class="button secondary" href="/voucher" data-route>Wróć do voucherów</a></div><p class="fine-print">To symulacja. Nie pobraliśmy płatności, nie wysłaliśmy e-maila i nie przyznaliśmy środków w ActiveNow.</p></section>`;
}

function emailPage() {
  const safeName=escapeHtml(order.name.trim().split(/\s+/)[0]||'');
  return `<section class="email-shell"><div class="email-metadata"><div class="email-toolbar"><a href="/voucher" data-route>Wróć do formularza</a><span>Podgląd e-maila po zakupie</span></div><p><strong>Od:</strong> uNick Academy &lt;hello@unick-academy.pl&gt;</p><p><strong>Do:</strong> ${escapeHtml(order.email)}</p><p><strong>Temat:</strong> Twój voucher uNick Academy jest gotowy</p></div><article class="email-paper" aria-label="Przykładowa wiadomość z voucherem"><img class="email-logo" src="./assets/official-logo.jpg" alt="uNick Academy" width="310" height="136"/><p class="eyebrow">DOBRE ROZMOWY ZACZYNAJĄ SIĘ TUTAJ</p><h1>Twój voucher.<br /><em>Cały świat możliwości.</em></h1><p class="email-greeting">Cześć${safeName?' '+safeName:''}.<br />Dziękujemy za wybór uNick Academy. Oto Twój voucher o wartości <strong>${currency(order.offer.value)}</strong>. ${order.gift?'Gotowy, żeby podarować go komuś bliskiemu.':'Gotowy na Twój kolejny dobry początek.'}</p><img id="email-voucher-image" class="email-art" src="${svgDataUrl(createVoucherSvg({value:order.offer.value,code:order.code,validUntil:order.validUntil}))}" alt="Voucher ${currency(order.offer.value)}, kod ${escapeHtml(order.code)}, puste miejsce na imię odbiorcy. Wzór nieaktywny." width="1600" height="1000"/><div class="email-download"><button type="button" class="button" data-download-voucher>Pobierz voucher do podarowania</button><p class="fine-print">PNG w wysokiej rozdzielczości · do wydruku lub przesłania</p><button type="button" class="text-button" data-copy-code>Kopiuj kod vouchera</button></div><div class="redemption-copy"><h2>Teraz wystarczy przekazać go dalej.</h2><p>${order.gift?'Prześlij voucher bliskiej osobie albo wydrukuj i wpisz jej imię w pustym miejscu. Nie wysyłamy niczego do obdarowanej osoby.':'Zachowaj voucher i podaj nam kod, gdy zechcesz ustalić pierwsze zajęcia.'}<br /><br />Żeby skorzystać z vouchera, odbiorca przekazuje nam kod przy pierwszym kontakcie. Po weryfikacji przypiszemy <strong>${currency(order.offer.value)}</strong> do właściwego konta w ActiveNow. Kolejne należności za zajęcia będą pomniejszać tę wartość.<br /><br />Voucher jest ważny do <strong>${order.validUntil}</strong>. Można korzystać z różnych nauczycieli, indywidualnie lub w grupie, online albo stacjonarnie, według dostępności i uzgodnionych cen.</p><p class="email-signature">Do usłyszenia,<br /><strong>Milena i zespół uNick Academy</strong><br /><a href="mailto:hello@unick-academy.pl" class="inline-link">hello@unick-academy.pl</a> · +48 666 661 750</p></div><p class="email-note">Przykładowy zakup: ${currency(order.offer.price)} wpłaty + ${currency(order.offer.bonus)} bonusu = ${currency(order.offer.value)} na zajęcia.<br />To wzór wiadomości i vouchera. Kod DEMO jest nieaktywny.<br /><button class="text-button" data-open-terms>Zasady wykorzystania</button></p></article></section>`;
}

function render() {
  renderedPng=null;
  const path=routePath().split('#')[0].replace(/\/$/,'')||'/';
  document.querySelector('[data-nav-voucher]').toggleAttribute('aria-current',path.startsWith('/voucher'));
  if(path==='/voucher/email'){main.innerHTML=emailPage();preparePng();}
  else if(path==='/voucher/potwierdzenie')main.innerHTML=confirmationPage();
  else if(path==='/voucher'){main.innerHTML=voucherPage();bindCheckout();}
  else {main.innerHTML=homePage();if(!sessionGet('unick-bf-mock-dismissed')||new URLSearchParams(location.search).get('popup')==='1')requestAnimationFrame(()=>welcomeModal.showModal());}
  document.title=path==='/voucher/email'?'Przykładowy e-mail z voucherem | uNick Academy':'Vouchery Black Friday | uNick Academy — podgląd';
}

function bindCheckout() {
  document.querySelector('#purchase-form').addEventListener('change',event=>{
    if(event.target.name==='voucherValue'){
      selectedOffer=offers.find(offer=>offer.value===Number(event.target.value));
      document.querySelector('[data-summary-value]').textContent=currency(selectedOffer.value);
      document.querySelector('[data-summary-bonus]').textContent=currency(selectedOffer.bonus);
      document.querySelector('[data-summary-price]').textContent=currency(selectedOffer.price);
      document.querySelector('[data-buy-button]').textContent=`Przetestuj zakup za ${currency(selectedOffer.price)}`;
    }
    if(event.target.name==='gift')document.querySelector('#gift-helper').textContent=event.target.value==='yes'?'Na voucherze zostawimy puste miejsce na imię. Możesz wpisać je odręcznie. Niespodzianka zostaje między nami.':'Voucher wyślemy do Ciebie. Nie musisz teraz wybierać nauczyciela ani terminów.';
  });
  document.querySelector('#purchase-form').addEventListener('submit',event=>{
    event.preventDefault();
    const buyerName=document.querySelector('#buyer-name');
    const buyerEmail=document.querySelector('#buyer-email');
    const terms=document.querySelector('#accept-terms');
    const errors=[[buyerName,'buyer-name-error',buyerName.value.trim().length<2?'Wpisz imię i nazwisko kupującego.':''],[buyerEmail,'buyer-email-error',!buyerEmail.value.trim()||!buyerEmail.validity.valid?'Wpisz poprawny adres e-mail, na który ma trafić voucher.':''],[terms,'terms-error',!terms.checked?'Zaznacz akceptację zasad, aby przejść dalej.':'']];
    for(const [field,errorId,message] of errors){document.querySelector('#'+errorId).textContent=message;field.setAttribute('aria-invalid',message?'true':'false');}
    const firstError=errors.find(([, ,message])=>message);
    if(firstError){firstError[0].focus();return;}
    order={offer:selectedOffer,name:buyerName.value.trim(),email:buyerEmail.value.trim(),gift:document.querySelector('[name=gift]:checked').value==='yes',code:makeDemoCode(),validUntil:'27.11.2027'};
    showPayment();
  });
}

function makeDemoCode() {const bytes=crypto.getRandomValues(new Uint8Array(8));const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';const token=[...bytes].map(value=>alphabet[value%32]).join('');return `DEMO-UNICK-${token.slice(0,4)}-${token.slice(4)}`;}
function showPayment() {
  paymentModal.innerHTML=`<button type="button" class="close-button" aria-label="Zamknij symulację płatności" data-close-payment>×</button><p class="eyebrow">PAYU · SYMULACJA</p><h2 id="payment-title">Ostatni krok przed<br />dobrym początkiem.</h2><p class="fine-print">Voucher ${currency(order.offer.value)} · ${order.gift?'na prezent':'dla siebie'}</p><p class="amount">${currency(order.offer.price)}</p><label class="payment-choice"><input type="radio" name="paymentMethod" value="blik" checked/>BLIK</label><label class="payment-choice"><input type="radio" name="paymentMethod" value="card"/>Karta płatnicza</label><p class="demo-note">To tylko podgląd. Nie wpisujesz kodu BLIK ani danych karty. Kliknięcie poniżej nie pobiera pieniędzy.</p><button type="button" class="button full" data-simulate-payment>Symuluj opłacenie</button>`;
  paymentModal.showModal();
}

async function preparePng() {
  try {const data=await voucherPng(createVoucherSvg({value:order.offer.value,code:order.code,validUntil:order.validUntil}));if(routePath().split('#')[0]==='/voucher/email'){renderedPng=data;document.querySelector('#email-voucher-image').src=data;}}
  catch{showToast('Podgląd grafiki jest dostępny. Spróbuj ponownie pobrać voucher.');}
}

document.addEventListener('click',async event=>{
  const target=event.target.closest('a,button');if(!target)return;
  if(target.matches('[data-route]')){event.preventDefault();navigate(target.getAttribute('href'));}
  if(target.matches('[data-close-welcome]'))dismissWelcome();
  if(target.matches('[data-open-welcome]'))welcomeModal.showModal();
  if(target.matches('[data-open-terms]'))termsModal.showModal();
  if(target.matches('[data-close-terms]'))termsModal.close();
  if(target.matches('[data-close-payment]'))paymentModal.close();
  if(target.matches('[data-simulate-payment]')){target.disabled=true;target.textContent='Przygotowujemy podgląd vouchera…';setTimeout(()=>navigate('/voucher/potwierdzenie'),450);}
  if(target.matches('[data-download-voucher]')){target.disabled=true;try{const data=renderedPng||await voucherPng(createVoucherSvg({value:order.offer.value,code:order.code,validUntil:order.validUntil}));downloadAsset(data,`uNick-Academy-voucher-${order.offer.value}-DEMO.png`);}catch{showToast('Nie udało się pobrać grafiki. Spróbuj ponownie.');}finally{target.disabled=false;}}
  if(target.matches('[data-copy-code]')){try{await navigator.clipboard.writeText(order.code);showToast('Kod skopiowany. To kod demonstracyjny.');}catch{showToast(order.code);}}
});
welcomeModal.addEventListener('cancel',event=>{event.preventDefault();dismissWelcome();});
for(const dialog of [welcomeModal,paymentModal,termsModal])dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const bounds=dialog.getBoundingClientRect();if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom){if(dialog===welcomeModal)dismissWelcome();else dialog.close();}});
window.addEventListener('popstate',render);
render();
