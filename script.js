(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var peso = function (n) { return "₱" + n.toLocaleString("en-PH"); };
  $("#year").textContent = new Date().getFullYear();

  $$("img").forEach(function (img) {
    img.addEventListener("error", function () { img.style.visibility = "hidden"; });
  });

  var navToggle = $("#nav-toggle"), nav = $("#site-nav");
  function setNav(open) {
    nav.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", open);
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  navToggle.addEventListener("click", function () { setNav(!nav.classList.contains("is-open")); });
  $$(".nav-links a").forEach(function (a) { a.addEventListener("click", function () { setNav(false); }); });

  var links = $$(".nav-links a");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          links.forEach(function (l) { l.classList.toggle("is-current", l.getAttribute("href") === "#" + e.target.id); });
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$("main section[id]").forEach(function (s) { io.observe(s); });
  }

  var grid = $("#product-grid"), products = $$(".product", grid);
  products.forEach(function (p, i) { p.dataset.order = i; });
  var filter = "all";
  function applyShop() {
    var q = $("#search").value.trim().toLowerCase(), shown = 0, sort = $("#sort").value;
    products.sort(function (a, b) {
      if (sort === "low") return a.dataset.price - b.dataset.price;
      if (sort === "high") return b.dataset.price - a.dataset.price;
      return a.dataset.order - b.dataset.order;
    }).forEach(function (p) {
      var ok = (filter === "all" || p.dataset.category === filter) && p.dataset.name.toLowerCase().indexOf(q) > -1;
      p.hidden = !ok; if (ok) shown++;
      grid.appendChild(p);
    });
    $("#empty-state").hidden = shown > 0;
    $("#shop-count").textContent = "Showing " + shown + " of " + products.length;
  }
  $$(".chip").forEach(function (c) {
    c.addEventListener("click", function () {
      $$(".chip").forEach(function (x) { x.classList.remove("is-active"); });
      c.classList.add("is-active"); filter = c.dataset.filter; applyShop();
    });
  });
  $("#search").addEventListener("input", applyShop);
  $("#sort").addEventListener("change", applyShop);

  var toast = $("#toast"), toastTimer;
  function showToast(msg) {
    toast.textContent = msg; toast.classList.add("is-show");
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { toast.classList.remove("is-show"); }, 2200);
  }

  var cart = [];
  try { cart = JSON.parse(localStorage.getItem("hr-cart") || "[]"); } catch (e) { cart = []; }
  function save() { try { localStorage.setItem("hr-cart", JSON.stringify(cart)); } catch (e) {} }

  var drawer = $("#cart-drawer"), overlay = $("#cart-overlay"), cartBtn = $("#cart-btn");
  function openCart(open) {
    drawer.classList.toggle("is-open", open); overlay.classList.toggle("is-open", open);
    cartBtn.setAttribute("aria-expanded", open);
    if (open) $("#cart-close").focus(); else cartBtn.focus();
  }
  cartBtn.addEventListener("click", function () { openCart(true); });
  $("#cart-close").addEventListener("click", function () { openCart(false); });
  overlay.addEventListener("click", function () { openCart(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { if (drawer.classList.contains("is-open")) openCart(false); setNav(false); } });

  function renderCart() {
    var list = $("#cart-items"), count = 0, total = 0;
    list.innerHTML = "";
    cart.forEach(function (it, i) {
      count += it.qty; total += it.qty * it.price;
      var li = document.createElement("li"); li.className = "cart-item";
      li.innerHTML = '<div><h3></h3><div class="qty"><button type="button" aria-label="Decrease quantity">&minus;</button><span></span><button type="button" aria-label="Increase quantity">+</button></div></div>' +
        '<span class="line-price"></span><button type="button" class="cart-remove">Remove</button>';
      $("h3", li).textContent = it.name;
      $(".qty span", li).textContent = it.qty;
      $(".line-price", li).textContent = peso(it.qty * it.price);
      var b = $$(".qty button", li);
      b[0].addEventListener("click", function () { it.qty--; if (it.qty < 1) cart.splice(i, 1); update(); });
      b[1].addEventListener("click", function () { it.qty++; update(); });
      $(".cart-remove", li).addEventListener("click", function () { cart.splice(i, 1); update(); });
      list.appendChild(li);
    });
    $("#cart-count").textContent = count;
    cartBtn.setAttribute("aria-label", "Cart, " + count + (count === 1 ? " item" : " items"));
    $("#cart-total").textContent = peso(total);
    $("#cart-empty").hidden = cart.length > 0;
    $("#cart-foot").hidden = cart.length === 0;
  }
  function update() { save(); renderCart(); }

  $$(".add-to-cart").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var p = btn.closest(".product"), name = p.dataset.name, price = +p.dataset.price;
      var found = cart.filter(function (c) { return c.name === name; })[0];
      if (found) found.qty++; else cart.push({ name: name, price: price, qty: 1 });
      update(); showToast(name + " added to cart");
    });
  });
  $("#cart-clear").addEventListener("click", function () { cart = []; update(); });

  var DEMO = true; /* set to false when the store goes live */
  var PAY_INFO = "GCash 09XX XXX XXXX (account name)";
  var DOWN_RATE = 0.15;
  function send(form) {
    return fetch("https://api.web3forms.com/submit", { method: "POST", body: new FormData(form) })
      .then(function (r) { return r.json(); })
      .then(function (d) { if (!d.success) throw new Error(d.message); });
  }
  var modal = $("#order-modal"), orderForm = $("#order-form");
  function openOrder(open) {
    modal.hidden = !open;
    document.body.style.overflow = open ? "hidden" : "";
    if (open) orderForm.elements.name.focus();
  }
  $("#order-close").addEventListener("click", function () { openOrder(false); });
  modal.addEventListener("click", function (e) { if (e.target === modal) openOrder(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !modal.hidden) openOrder(false); });

  $("#checkout-btn").addEventListener("click", function () {
    if (!cart.length) return;
    openCart(false);
    var total = 0, lines = [], box = $("#order-summary");
    box.innerHTML = "";
    function row(label, value, cls) {
      var r = document.createElement("div"); r.className = "row " + (cls || "");
      r.innerHTML = "<span></span><span></span>";
      r.children[0].textContent = label; r.children[1].textContent = value; box.appendChild(r);
    }
    cart.forEach(function (c) {
      total += c.qty * c.price;
      lines.push(c.qty + " x " + c.name + " - " + peso(c.qty * c.price));
      row(c.qty + " \u00d7 " + c.name, peso(c.qty * c.price));
    });
    var down = Math.ceil(total * DOWN_RATE);
    row("Total", peso(total), "strong");
    row("Down payment (15%), due now", peso(down), "strong due");
    row("Balance on delivery or pickup", peso(total - down));
    $("#pay-info").textContent = "Send " + peso(down) + " to " + PAY_INFO;
    $("#demo-note").hidden = !DEMO;
    $("#f-items").value = lines.join("\n");
    $("#f-total").value = peso(total);
    $("#f-down").value = peso(down);
    $("#order-error").hidden = true;
    openOrder(true);
  });

  orderForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = orderForm, g = function (n) { return f.elements[n].value.trim(); }, err = $("#order-error"), btn = $("#order-submit");
    function fail(m) { err.textContent = m; err.hidden = false; }
    if (!g("name") || !g("address") || !g("payment_reference")) return fail("Please fill in your name, address and payment reference number.");
    if (g("phone").replace(/\D/g, "").length < 10) return fail("Enter a mobile number with at least 10 digits.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(g("email"))) return fail("Enter a valid email address, like name@example.com.");
    err.hidden = true; btn.disabled = true; btn.textContent = "Sending...";
    send(f).then(function () {
      cart = []; update(); f.reset(); openOrder(false);
      showToast("Order received. We will message you to confirm.");
    }).catch(function () {
      fail("Your order could not be sent. Please call 0995 318 3352 or email lagubanarowel@gmail.com.");
    }).then(function () { btn.disabled = false; btn.textContent = "Place order"; });
  });

  var HOURS = { 0: [12, 18], 1: [10, 19], 2: [10, 19], 3: [10, 19], 4: [10, 19], 5: [10, 19], 6: [10, 20] };
  function clock(h) { return (h % 12 || 12) + (h < 12 ? " am" : " pm"); }
  var manila = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  var day = manila.getDay(), hr = manila.getHours() + manila.getMinutes() / 60, t = HOURS[day];
  $("#open-status").textContent = hr >= t[0] && hr < t[1] ? "Open until " + clock(t[1])
    : hr < t[0] ? "Opens at " + clock(t[0]) : "Closed, opens " + clock(HOURS[(day + 1) % 7][0]) + " tomorrow";

  $("#contact-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var err = $("#form-error"), ok = $("#form-ok");
    var name = this.name.value.trim(), email = this.email.value.trim(), msg = this.message.value.trim();
    ok.hidden = true;
    if (!name || !email || !msg) { err.textContent = "Please fill in your name, email and message."; err.hidden = false; return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = "Enter a valid email address, like name@example.com."; err.hidden = false; return; }
    err.hidden = true;
    var form = this, btn = form.querySelector("button[type=submit]");
    btn.disabled = true; btn.textContent = "Sending...";
    send(form).then(function () {
      ok.textContent = "Thanks, your message was sent. We will reply soon."; ok.hidden = false; form.reset();
    }).catch(function () {
      err.textContent = "Your message could not be sent. Please call 0995 318 3352 or email lagubanarowel@gmail.com."; err.hidden = false;
    }).then(function () { btn.disabled = false; btn.textContent = "Send message"; });
  });

  applyShop(); renderCart();
})();
