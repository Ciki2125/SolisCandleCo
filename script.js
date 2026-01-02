// helpers
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// ELEMENTE
const cartEl = $("#cart");
const cartBackdrop = $("#cartBackdrop");
const cartPanel = $(".cart__panel");
const openCartBtn = $("#openCart");
const closeCartBtn = $("#closeCart");
const cartItemsEl = $("#cartItems");
const cartTotalEl = $("#cartTotal");
const cartCountEl = $("#cartCount");
const goCheckoutBtn = $("#goCheckout");
const clearCartBtn = $("#clearCart");

// CHECKOUT
const checkoutEl = $("#checkout");
const closeCheckoutBtn = $("#closeCheckout");
const checkoutBackdrop = $("#checkoutBackdrop");

// BUTOANE ADAUGĂ
const addBtns = $$("[data-add]");

// STATE
let cart = [];

/* =====================
   CART OPEN / CLOSE
===================== */
function openCart() {
  cartEl.classList.add("is-open");
  document.body.style.overflow = "hidden";
}

function closeCart() {
  cartEl.classList.remove("is-open");
  document.body.style.overflow = "";
}

openCartBtn.onclick = openCart;
closeCartBtn.onclick = closeCart;
cartBackdrop.onclick = closeCart;
goCheckoutBtn.onclick = openCheckout;

clearCartBtn.onclick = () => {
  cart = [];
  renderCart();
};

// click în panou NU închide coșul
cartPanel.addEventListener("click", e => e.stopPropagation());

/* =====================
   ADD TO CART
===================== */
addBtns.forEach(btn => {
  btn.onclick = () => {
    const id = btn.dataset.id;
    const name = btn.dataset.name;
    const price = Number(btn.dataset.price);

    const found = cart.find(p => p.id === id);
    if (found) found.qty++;
    else cart.push({ id, name, price, qty: 1 });

    renderCart();
    openCart();
  };
});

/* =====================
   RENDER CART
===================== */
function renderCart() {
  cartItemsEl.innerHTML = "";

  let total = 0;
  let count = 0;

  if (cart.length === 0) {
    cartItemsEl.innerHTML = "<p>Coșul este gol.</p>";
  }

  cart.forEach(item => {
    total += item.qty * item.price;
    count += item.qty;

    const div = document.createElement("div");
    div.className = "cartItem";
    div.innerHTML = `
      <span>${item.name}</span>
      <div>
        <button class="dec">−</button>
        <span>${item.qty}</span>
        <button class="inc">+</button>
      </div>
    `;

    div.querySelector(".inc").onclick = () => {
      item.qty++;
      renderCart();
    };

    div.querySelector(".dec").onclick = () => {
      item.qty--;
      if (item.qty <= 0) cart = cart.filter(i => i !== item);
      renderCart();
    };

    cartItemsEl.appendChild(div);
  });

  cartTotalEl.textContent = total;
  cartCountEl.textContent = count;
}

/* =====================
   CHECKOUT (RAMBURS)
===================== */
function openCheckout() {
  if (cart.length === 0) {
    alert("Coșul este gol.");
    return;
  }

  closeCart();
  checkoutEl.classList.add("is-open");
  document.body.style.overflow = "hidden";
}

function closeCheckout() {
  checkoutEl.classList.remove("is-open");
  document.body.style.overflow = "";
}

goCheckoutBtn.onclick = openCheckout;
closeCheckoutBtn.onclick = closeCheckout;
checkoutBackdrop.onclick = closeCheckout;

/* INIT */
renderCart();
/* =====================
   SUBMIT CHECKOUT -> TRIMITE EMAIL
===================== */
const checkoutForm = $("#checkoutForm");

if (checkoutForm) {
  checkoutForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // 1) Luăm datele din formular
    const fd = new FormData(checkoutForm);
    const formData = Object.fromEntries(fd.entries());

    // 2) Construim mesajul comenzii (include produsele din coș)
    const produse = cart
      .map((p) => `- ${p.name} x${p.qty} = ${p.qty * p.price} lei`)
      .join("\n");

    const total = cart.reduce((sum, p) => sum + p.qty * p.price, 0);

    const mesaj = `
COMANDĂ NOUĂ 🕯️

Nume: ${formData.name || "-"}
Email: ${formData.email || "-"}
Telefon: ${formData.phone || "-"}
Adresă: ${formData.address || "-"}
Detalii livrare: ${formData.notes || "-"}

Plată: ${formData.payment || "Ramburs"}

Produse:
${produse}

Total: ${total} lei
    `.trim();

    // 3) Trimitem către serverul Node (care trimite mailurile)
    try {
      const res = await fetch("http://localhost:5000/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name || "Client",
          email: formData.email, // aici emailul clientului (ca să primească confirmare)
          message: mesaj,
        }),
      });

      const out = await res.json();

      if (out.success) {
        alert("Comanda a fost trimisă ✅ Verifică emailul!");

        // optional: golește coșul după comandă
        cart = [];
        renderCart();
        closeCheckout();
        checkoutForm.reset();
      } else {
        alert("Eroare la trimitere ❌");
      }
    } catch (err) {
      console.error(err);
      alert("Nu pot contacta serverul. E pornit? ❌");
    }
  });
}