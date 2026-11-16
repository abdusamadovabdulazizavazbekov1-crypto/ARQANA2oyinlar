// ARQANA 2 — o'yinlar platformasi (games.js)
// Tuzilishi:
//   1) Yordamchi funksiyalar
//   2) Har bir o'yin: function(quti, ctx) — o'yinni "quti" ichiga quradi
//   3) O'yinlar ro'yxati (GAMES)
//   4) Sahifani chizish: yosh rejimi, turkum filtri, o'yin oynasi
(function () {
  "use strict";

  /* ---------- 1. Yordamchi funksiyalar ---------- */

  function h(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function $(id) { return document.getElementById(id); }
  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function load(key) {
    try { var v = localStorage.getItem(key); return v === null ? null : Number(v); } catch (e) { return null; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, String(value)); } catch (e) {}
  }

  /* ---------- 2. O'yinlar ---------- */
  // Har bir o'yinga ctx beriladi:
  //   ctx.age     — yosh rejimi ("6-12", "13-17", "18+")
  //   ctx.record(natija) — natijani rekord bilan solishtiradi, yangi rekord bo'lsa true qaytaradi

  // --- Sharni bos (tezkorlik) ---
  function tap(box, ctx) {
    var c = { "6-12": { size: 84, time: 20 }, "13-17": { size: 60, time: 15 }, "18+": { size: 44, time: 12 } }[ctx.age];
    var score = 0, left = c.time, timer = null;

    var stats = h("div", "stats");
    var sc = h("span", "", "Ball: 0");
    var tm = h("span", "", "Vaqt: " + left);
    stats.append(sc, tm);

    var arena = h("div", "arena");
    var msg = h("div", "amsg", "“Boshlash” tugmasini bosing");
    var orb = h("button", "orb");
    orb.style.width = orb.style.height = c.size + "px";
    orb.hidden = true;
    orb.setAttribute("aria-label", "Shar");
    arena.append(msg, orb);

    var go = h("button", "btn", "Boshlash");
    box.append(stats, arena, go);

    function move() {
      orb.style.left = Math.random() * (arena.clientWidth - c.size) + "px";
      orb.style.top = Math.random() * (arena.clientHeight - c.size) + "px";
    }
    function end() {
      clearInterval(timer);
      orb.hidden = true;
      go.disabled = false;
      go.textContent = "Qayta o‘ynash";
      msg.textContent = "Natija: " + score + (ctx.record(score) ? " · Yangi rekord!" : "");
    }
    go.onclick = function () {
      score = 0; left = c.time;
      sc.textContent = "Ball: 0"; tm.textContent = "Vaqt: " + left;
      msg.textContent = ""; orb.hidden = false; go.disabled = true;
      move();
      timer = setInterval(function () {
        left--; tm.textContent = "Vaqt: " + left;
        if (left <= 0) end();
      }, 1000);
    };
    orb.onclick = function () { score++; sc.textContent = "Ball: " + score; move(); };
    return function () { clearInterval(timer); };
  }

  // --- Xotira kartalari ---
  function memory(box, ctx) {
    var c = { "6-12": { cols: 4, pairs: 6 }, "13-17": { cols: 4, pairs: 8 }, "18+": { cols: 6, pairs: 12 } }[ctx.age];
    var symbols = ["★", "♥", "♦", "♣", "☀", "☂", "♫", "⚑", "✿", "☾", "⚓", "✈"].slice(0, c.pairs);
    var deck = shuffle(symbols.concat(symbols));
    var first = null, lock = false, moves = 0, found = 0, timeouts = [];

    var stats = h("div", "stats");
    var mv = h("span", "", "Yurishlar: 0");
    var pr = h("span", "", "Juftlar: 0 / " + c.pairs);
    stats.append(mv, pr);

    var grid = h("div", "mgrid");
    grid.style.gridTemplateColumns = "repeat(" + c.cols + ", 1fr)";
    var note = h("p", "note", "Bir xil juftlarni toping. Kam yurish — yaxshi natija.");

    deck.forEach(function (sym) {
      var b = h("button", "mcard", sym);
      b.onclick = function () {
        if (lock || b.classList.contains("open") || b.classList.contains("done")) return;
        b.classList.add("open");
        if (!first) { first = b; return; }
        moves++; mv.textContent = "Yurishlar: " + moves;
        if (first.textContent === b.textContent) {
          first.className = b.className = "mcard done";
          first = null; found++;
          pr.textContent = "Juftlar: " + found + " / " + c.pairs;
          if (found === c.pairs) {
            note.textContent = moves + " yurishda tugadi!" + (ctx.record(moves) ? " Yangi rekord!" : "");
            again.hidden = false;
          }
        } else {
          lock = true;
          var a = first; first = null;
          timeouts.push(setTimeout(function () {
            a.classList.remove("open"); b.classList.remove("open"); lock = false;
          }, 700));
        }
      };
      grid.appendChild(b);
    });

    var again = h("button", "btn", "Qayta o‘ynash");
    again.hidden = true;
    again.onclick = function () { ctx.restart(); };
    box.append(stats, grid, note, again);
    return function () { timeouts.forEach(clearTimeout); };
  }

  // --- Tez hisob (mantiq) ---
  function math(box, ctx) {
    var TOTAL = 30, left = TOTAL, score = 0, answer = 0, timer = null, playing = false;

    var stats = h("div", "stats");
    var sc = h("span", "", "To‘g‘ri: 0");
    var tm = h("span", "", "Vaqt: " + left);
    stats.append(sc, tm);

    var q = h("div", "big", "—");
    var opts = h("div", "opts two");
    var note = h("p", "note", "30 soniyada iloji boricha ko‘p misol yeching.");
    var go = h("button", "btn", "Boshlash");
    box.append(stats, q, opts, note, go);

    function make() {
      var a, b, op, r = Math.random();
      if (ctx.age === "6-12") {
        op = r < 0.5 ? "+" : "−"; a = ri(2, 20); b = ri(1, 20);
        if (op === "−" && b > a) { var t = a; a = b; b = t; }
      } else if (ctx.age === "13-17") {
        if (r < 0.4) { op = "×"; a = ri(2, 12); b = ri(2, 12); }
        else if (r < 0.7) { op = "+"; a = ri(10, 99); b = ri(10, 99); }
        else { op = "−"; a = ri(30, 99); b = ri(10, a); }
      } else {
        if (r < 0.4) { op = "×"; a = ri(6, 20); b = ri(3, 15); }
        else if (r < 0.7) { op = "+"; a = ri(100, 500); b = ri(100, 500); }
        else { op = "−"; a = ri(200, 900); b = ri(50, a); }
      }
      answer = op === "+" ? a + b : op === "−" ? a - b : a * b;
      q.textContent = a + " " + op + " " + b;

      var spread = ctx.age === "6-12" ? 5 : 10;
      var set = [answer];
      while (set.length < 4) {
        var v = answer + ri(-spread, spread);
        if (v >= 0 && set.indexOf(v) === -1) set.push(v);
      }
      opts.innerHTML = "";
      shuffle(set).forEach(function (v) {
        var b2 = h("button", "opt", String(v));
        b2.onclick = function () {
          if (!playing) return;
          if (v === answer) { score++; sc.textContent = "To‘g‘ri: " + score; note.textContent = "To‘g‘ri!"; }
          else { note.textContent = "Noto‘g‘ri. Javob: " + answer; }
          make();
        };
        opts.appendChild(b2);
      });
    }
    function end() {
      clearInterval(timer); playing = false;
      opts.innerHTML = ""; q.textContent = score + " ta";
      note.textContent = "Vaqt tugadi! Natija: " + score + (ctx.record(score) ? " · Yangi rekord!" : "");
      go.disabled = false; go.textContent = "Qayta o‘ynash";
    }
    go.onclick = function () {
      score = 0; left = TOTAL; playing = true;
      sc.textContent = "To‘g‘ri: 0"; tm.textContent = "Vaqt: " + left;
      note.textContent = ""; go.disabled = true;
      make();
      timer = setInterval(function () {
        left--; tm.textContent = "Vaqt: " + left;
        if (left <= 0) end();
      }, 1000);
    };
    return function () { clearInterval(timer); };
  }

  // --- Viktorina ---
  // t — to'g'ri javobning raqami (0 dan boshlanadi)
  var QUESTIONS = {
    "6-12": [
      { q: "O‘zbekistonning poytaxti qaysi shahar?", a: ["Toshkent", "Samarqand", "Buxoro", "Andijon"], t: 0 },
      { q: "Bir haftada necha kun bor?", a: ["5", "6", "7", "8"], t: 2 },
      { q: "Quyosh qaysi tomondan chiqadi?", a: ["G‘arbdan", "Sharqdan", "Shimoldan", "Janubdan"], t: 1 },
      { q: "Navro‘z bayrami qaysi faslda nishonlanadi?", a: ["Qishda", "Yozda", "Bahorda", "Kuzda"], t: 2 },
      { q: "5 + 7 nechaga teng?", a: ["10", "11", "12", "13"], t: 2 },
      { q: "Qaysi hayvon “cho‘l kemasi” deb ataladi?", a: ["Ot", "Tuya", "Eshak", "Qo‘y"], t: 1 },
      { q: "Suv necha darajada qaynaydi?", a: ["50", "80", "100", "150"], t: 2 },
      { q: "O‘zbekiston bayrog‘idagi eng yuqori katta chiziq qaysi rangda?", a: ["Ko‘k", "Qizil", "Sariq", "Qora"], t: 0 }
    ],
    "13-17": [
      { q: "Registon maydoni qaysi shaharda joylashgan?", a: ["Samarqand", "Xiva", "Qarshi", "Namangan"], t: 0 },
      { q: "“Boburnoma” asarining muallifi kim?", a: ["Alisher Navoiy", "Zahiriddin Muhammad Bobur", "Abu Rayhon Beruniy", "Ibn Sino"], t: 1 },
      { q: "Mirzo Ulug‘bek qaysi fan bilan mashhur?", a: ["Tibbiyot", "Kimyo", "Astronomiya", "Adabiyot"], t: 2 },
      { q: "Al-Xorazmiy qaysi fanning asoschilaridan biri hisoblanadi?", a: ["Geografiya", "Algebra", "Biologiya", "Tarix"], t: 1 },
      { q: "O‘zbekiston Mustaqillik kuni qachon nishonlanadi?", a: ["1 sentabr", "21 mart", "9 may", "8 dekabr"], t: 0 },
      { q: "HTML nima uchun ishlatiladi?", a: ["Sahifa tuzilmasini yozish uchun", "Ma’lumotlar bazasi uchun", "Rasm chizish uchun", "Video tahrirlash uchun"], t: 0 },
      { q: "CSS nima uchun ishlatiladi?", a: ["Server yaratish uchun", "Sayt dizaynini berish uchun", "Parolni saqlash uchun", "Internetni tezlashtirish uchun"], t: 1 },
      { q: "Brauzerda ishlaydigan dasturlash tili qaysi?", a: ["JavaScript", "Photoshop", "Excel", "Windows"], t: 0 }
    ],
    "18+": [
      { q: "Amir Temur qaysi shaharda tug‘ilgan?", a: ["Toshkent", "Termiz", "Shahrisabz (Kesh)", "Farg‘ona"], t: 2 },
      { q: "“Qutadg‘u bilig” asarining muallifi kim?", a: ["Yusuf Xos Hojib", "Mahmud Qoshg‘ariy", "Alisher Navoiy", "Ahmad Yassaviy"], t: 0 },
      { q: "“Algoritm” so‘zi qaysi olim nomidan kelib chiqqan?", a: ["Ibn Sino", "Al-Xorazmiy", "Beruniy", "Farobiy"], t: 1 },
      { q: "HTTP so‘zi nimaning qisqartmasi?", a: ["HyperText Transfer Protocol", "High Tech Transfer Program", "Home Text Transfer Page", "Hyper Tool Transport Path"], t: 0 },
      { q: "Ma’lumotlar bazasiga so‘rov yozish uchun qaysi til ishlatiladi?", a: ["CSS", "SQL", "HTML", "SVG"], t: 1 },
      { q: "Git dasturi nima uchun kerak?", a: ["Kod versiyalarini boshqarish", "Rasm tahrirlash", "Video yuklash", "Antivirus"], t: 0 },
      { q: "Ikkilik sanoq tizimida 1010 soni nechaga teng?", a: ["8", "10", "12", "20"], t: 1 },
      { q: "IPO nima?", a: ["Kompaniya aksiyalarini ommaga birinchi marta sotish", "Soliq to‘lash turi", "Bank krediti", "Reklama formati"], t: 0 }
    ]
  };

  function quiz(box, ctx) {
    var list = shuffle(QUESTIONS[ctx.age]);
    var total = list.length, i = 0, score = 0, answered = false;

    var stats = h("div", "stats");
    var cnt = h("span", "", "");
    var sc = h("span", "", "Ball: 0");
    stats.append(cnt, sc);
    var prog = h("div", "progress"), bar = h("i");
    prog.appendChild(bar);
    var qt = h("div", "qtext");
    var opts = h("div", "opts");
    var note = h("p", "note");
    var next = h("button", "btn", "Keyingisi");
    next.hidden = true;
    box.append(stats, prog, qt, opts, note, next);

    function show() {
      answered = false;
      var s = list[i];
      cnt.textContent = "Savol " + (i + 1) + " / " + total;
      bar.style.width = (i / total * 100) + "%";
      qt.textContent = s.q; note.textContent = ""; next.hidden = true;
      opts.innerHTML = "";
      shuffle(s.a.map(function (text, k) { return { text: text, ok: k === s.t }; })).forEach(function (v) {
        var b = h("button", "opt", v.text);
        b.onclick = function () {
          if (answered) return;
          answered = true;
          opts.querySelectorAll(".opt").forEach(function (x) {
            x.disabled = true;
            if (x.textContent === s.a[s.t]) x.classList.add("good");
          });
          if (v.ok) { score++; sc.textContent = "Ball: " + score; note.textContent = "To‘g‘ri!"; }
          else { b.classList.add("bad"); note.textContent = "Noto‘g‘ri."; }
          next.textContent = i === total - 1 ? "Natijani ko‘rish" : "Keyingisi";
          next.hidden = false;
        };
        opts.appendChild(b);
      });
    }
    function finish() {
      bar.style.width = "100%";
      qt.textContent = "Tugadi! Natija: " + score + " / " + total;
      opts.innerHTML = "";
      var text = score >= total - 1 ? "Ajoyib! Siz haqiqiy bilimdonsiz." : score >= total / 2 ? "Yaxshi natija!" : "Yana bir bor urinib ko‘ring.";
      note.textContent = text + (ctx.record(score) ? " Yangi rekord!" : "");
      next.textContent = "Qayta o‘ynash"; next.hidden = false;
      next.onclick = function () { ctx.restart(); };
    }
    next.onclick = function () { i++; if (i < total) show(); else finish(); };
    show();
    return function () {};
  }

  // --- Ilon (klassik) ---
  function snake(box, ctx) {
    var N = 18, CELL = 20, SIZE = N * CELL;
    var c = { "6-12": { ms: 170, wrap: true }, "13-17": { ms: 115, wrap: false }, "18+": { ms: 80, wrap: false } }[ctx.age];
    var body, dir, nextDir, food, score, timer = null, running = false;

    var stats = h("div", "stats");
    var sc = h("span", "", "Ball: 0");
    var hint = h("span", "", c.wrap ? "Devor yo‘q" : "Devorga tegmang");
    stats.append(sc, hint);

    var cv = h("canvas");
    cv.width = cv.height = SIZE;
    var g = cv.getContext("2d");
    var note = h("p", "note center", "Strelka yoki W A S D tugmalari bilan boshqaring.");
    var pad = h("div", "pad");
    var dirs = { up: [0, -1], lf: [-1, 0], dn: [0, 1], rt: [1, 0] };
    var labels = { up: "▲", lf: "◀", dn: "▼", rt: "▶" };
    Object.keys(dirs).forEach(function (k) {
      var b = h("button", k, labels[k]);
      b.onclick = function () { turn(dirs[k]); };
      pad.appendChild(b);
    });
    var wrapBtn = h("div", "center");
    var go = h("button", "btn", "Boshlash");
    wrapBtn.appendChild(go);
    box.append(stats, cv, note, pad, wrapBtn);

    function turn(d) {
      if (!running) return;
      if (d[0] === -dir[0] && d[1] === -dir[1]) return;   // orqaga burilmaydi
      nextDir = d;
    }
    function placeFood() {
      do { food = { x: ri(0, N - 1), y: ri(0, N - 1) }; }
      while (body.some(function (p) { return p.x === food.x && p.y === food.y; }));
    }
    function draw() {
      var css = getComputedStyle(document.body);
      g.fillStyle = "#070a1c"; g.fillRect(0, 0, SIZE, SIZE);
      g.fillStyle = "#ffc857";
      g.beginPath(); g.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2 - 3, 0, 6.3); g.fill();
      g.fillStyle = css.getPropertyValue("--accent").trim() || "#3fd8ff";
      body.forEach(function (p, k) {
        g.globalAlpha = k === 0 ? 1 : 0.8;
        g.fillRect(p.x * CELL + 1, p.y * CELL + 1, CELL - 2, CELL - 2);
      });
      g.globalAlpha = 1;
    }
    function over() {
      clearInterval(timer); running = false; go.disabled = false; go.textContent = "Qayta o‘ynash";
      note.textContent = "O‘yin tugadi. Natija: " + score + (ctx.record(score) ? " · Yangi rekord!" : "");
    }
    function step() {
      dir = nextDir;
      var head = { x: body[0].x + dir[0], y: body[0].y + dir[1] };
      if (c.wrap) { head.x = (head.x + N) % N; head.y = (head.y + N) % N; }
      else if (head.x < 0 || head.y < 0 || head.x >= N || head.y >= N) { over(); return; }
      if (body.some(function (p) { return p.x === head.x && p.y === head.y; })) { over(); return; }
      body.unshift(head);
      if (head.x === food.x && head.y === food.y) { score++; sc.textContent = "Ball: " + score; placeFood(); }
      else body.pop();
      draw();
    }
    function key(e) {
      var m = { ArrowUp: "up", w: "up", W: "up", ArrowLeft: "lf", a: "lf", A: "lf", ArrowDown: "dn", s: "dn", S: "dn", ArrowRight: "rt", d: "rt", D: "rt" }[e.key];
      if (!m) return;
      if (running) e.preventDefault();
      turn(dirs[m]);
    }
    document.addEventListener("keydown", key);
    go.onclick = function () {
      body = [{ x: 9, y: 9 }, { x: 8, y: 9 }, { x: 7, y: 9 }];
      dir = nextDir = [1, 0]; score = 0; sc.textContent = "Ball: 0";
      note.textContent = ""; placeFood(); running = true; go.disabled = true; draw();
      timer = setInterval(step, c.ms);
    };
    body = [{ x: 9, y: 9 }]; food = { x: 12, y: 9 }; dir = [1, 0]; draw();
    return function () { clearInterval(timer); document.removeEventListener("keydown", key); };
  }

  // --- Krestik-nolik (klassik) ---
  var LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  function winner(b) {
    for (var k = 0; k < LINES.length; k++) {
      var l = LINES[k];
      if (b[l[0]] && b[l[0]] === b[l[1]] && b[l[0]] === b[l[2]]) return b[l[0]];
    }
    return b.indexOf("") === -1 ? "D" : "";
  }
  function minimax(b, turnO) {                      // kompyuter = O
    var w = winner(b);
    if (w === "O") return 1;
    if (w === "X") return -1;
    if (w === "D") return 0;
    var best = turnO ? -2 : 2;
    for (var i = 0; i < 9; i++) {
      if (b[i]) continue;
      b[i] = turnO ? "O" : "X";
      var v = minimax(b, !turnO);
      b[i] = "";
      best = turnO ? Math.max(best, v) : Math.min(best, v);
    }
    return best;
  }
  function pickMove(b, age) {
    var free = [], i;
    for (i = 0; i < 9; i++) if (!b[i]) free.push(i);
    if (age === "6-12") return free[ri(0, free.length - 1)];
    if (age === "13-17") {                         // yutadi, to'sadi, markazni oladi
      for (var side = 0; side < 2; side++) {
        var who = side === 0 ? "O" : "X";
        for (i = 0; i < free.length; i++) {
          b[free[i]] = who;
          var w = winner(b);
          b[free[i]] = "";
          if (w === who) return free[i];
        }
      }
      if (!b[4]) return 4;
      return free[ri(0, free.length - 1)];
    }
    var bestV = -2, bestI = free[0];                // 18+: yengib bo'lmaydi
    free.forEach(function (m) {
      b[m] = "O"; var v = minimax(b, false); b[m] = "";
      if (v > bestV) { bestV = v; bestI = m; }
    });
    return bestI;
  }

  function ttt(box, ctx) {
    var board = ["", "", "", "", "", "", "", "", ""], over = false, streak = 0, timers = [];
    var stats = h("div", "stats");
    var st = h("span", "", "Ketma-ket g‘alaba: 0");
    stats.append(st, h("span", "", "Siz — X"));
    var grid = h("div", "tgrid");
    var cells = [];
    var note = h("p", "note center", "Sizning yurishingiz.");
    var again = h("button", "btn", "Yangi o‘yin");
    again.hidden = true;
    var wrapBtn = h("div", "center"); wrapBtn.appendChild(again);

    function render() {
      cells.forEach(function (b, i) {
        b.textContent = board[i];
        b.className = "tcell" + (board[i] === "O" ? " o" : "");
        b.disabled = over || !!board[i];
      });
    }
    function check() {
      var w = winner(board);
      if (!w) return false;
      over = true; again.hidden = false;
      if (w === "X") {
        streak++; st.textContent = "Ketma-ket g‘alaba: " + streak;
        note.textContent = "Siz yutdingiz!" + (ctx.record(streak) ? " Yangi rekord!" : "");
      } else if (w === "O") {
        streak = 0; st.textContent = "Ketma-ket g‘alaba: 0"; note.textContent = "Kompyuter yutdi.";
      } else note.textContent = "Durang.";
      render();
      return true;
    }
    for (var i = 0; i < 9; i++) (function (k) {
      var b = h("button", "tcell");
      b.onclick = function () {
        if (over || board[k]) return;
        board[k] = "X"; render();
        if (check()) return;
        over = true; render(); note.textContent = "Kompyuter o‘ylayapti…";
        timers.push(setTimeout(function () {
          over = false;
          board[pickMove(board, ctx.age)] = "O";
          if (!check()) { note.textContent = "Sizning yurishingiz."; render(); }
        }, 400));
      };
      cells.push(b); grid.appendChild(b);
    })(i);
    again.onclick = function () {
      board = ["", "", "", "", "", "", "", "", ""]; over = false; again.hidden = true;
      note.textContent = "Sizning yurishingiz."; render();
    };
    box.append(stats, grid, note, wrapBtn);
    render();
    return function () { timers.forEach(clearTimeout); };
  }

  // --- Sonni top (mantiq) ---
  function guess(box, ctx) {
    var c = { "6-12": { max: 50, tries: 8 }, "13-17": { max: 100, tries: 7 }, "18+": { max: 1000, tries: 10 } }[ctx.age];
    var secret = ri(1, c.max), used = 0, done = false;

    var stats = h("div", "stats");
    var tr = h("span", "", "Urinish: 0 / " + c.tries);
    stats.append(h("span", "", "1 dan " + c.max + " gacha"), tr);
    var big = h("div", "big", "?");
    var row = h("div", "guess");
    var input = h("input"); input.type = "number"; input.min = 1; input.max = c.max; input.placeholder = "Sonni yozing";
    input.setAttribute("aria-label", "Son");
    var ok = h("button", "btn", "Tekshirish");
    row.append(input, ok);
    var note = h("p", "note", "Men sonni o‘yladim. Topa olasizmi?");
    var again = h("button", "btn", "Qayta o‘ynash"); again.hidden = true;
    box.append(stats, big, row, note, again);

    function check() {
      if (done) return;
      var v = Number(input.value);
      if (!input.value || v < 1 || v > c.max) { note.textContent = "1 dan " + c.max + " gacha son yozing."; return; }
      used++; tr.textContent = "Urinish: " + used + " / " + c.tries;
      if (v === secret) {
        done = true; big.textContent = secret;
        note.textContent = used + " urinishda topdingiz!" + (ctx.record(used) ? " Yangi rekord!" : "");
        again.hidden = false;
      } else if (used >= c.tries) {
        done = true; big.textContent = secret;
        note.textContent = "Urinishlar tugadi. Son " + secret + " edi."; again.hidden = false;
      } else {
        note.textContent = v < secret ? "Kattaroq son." : "Kichikroq son.";
      }
      input.value = ""; input.focus();
    }
    ok.onclick = check;
    input.onkeydown = function (e) { if (e.key === "Enter") check(); };
    again.onclick = function () { ctx.restart(); };
    return function () {};
  }

  /* ---------- 3. O'yinlar ro'yxati ---------- */
  // low: true bo'lsa — kam natija yaxshiroq (yurishlar, urinishlar)
  var GAMES = [
    { id: "tap",    name: "Sharni bos",  genre: "Tezkorlik", glyph: "●", unit: "ball",        low: false, ages: ["6-12", "13-17", "18+"], desc: "Sharni vaqt tugamasidan ko‘proq bosing.", run: tap },
    { id: "memory", name: "Xotira",      genre: "Xotira",    glyph: "▦", unit: "yurish",      low: true,  ages: ["6-12", "13-17", "18+"], desc: "Bir xil kartalar juftini toping.", run: memory },
    { id: "math",   name: "Tez hisob",   genre: "Mantiq",    glyph: "±", unit: "to‘g‘ri",     low: false, ages: ["6-12", "13-17", "18+"], desc: "30 soniyada ko‘p misol yeching.", run: math },
    { id: "guess",  name: "Sonni top",   genre: "Mantiq",    glyph: "#", unit: "urinish",     low: true,  ages: ["6-12", "13-17", "18+"], desc: "Yashirilgan sonni kam urinishda toping.", run: guess },
    { id: "quiz",   name: "Viktorina",   genre: "Viktorina", glyph: "?", unit: "ball",        low: false, ages: ["6-12", "13-17", "18+"], desc: "Yoshingizga mos savollarga javob bering.", run: quiz },
    { id: "ttt",    name: "Krestik-nolik", genre: "Klassik", glyph: "✕", unit: "g‘alaba",     low: false, ages: ["6-12", "13-17", "18+"], desc: "Kompyuterga qarshi o‘ynang.", run: ttt },
    { id: "snake",  name: "Ilon",        genre: "Klassik",   glyph: "≋", unit: "ball",        low: false, ages: ["6-12", "13-17", "18+"], desc: "Ilonni boqing va o‘zingizga tegmang.", run: snake }
  ];
  var LEVEL = { "6-12": "Oson", "13-17": "O‘rta", "18+": "Qiyin" };
  var HINT = {
    "6-12": "Bolalar uchun: katta tugmalar, oson va quvnoq o‘yinlar.",
    "13-17": "O‘smirlar uchun: o‘rtacha qiyinlik va ko‘proq tezlik.",
    "18+": "Kattalar uchun: eng qiyin darajalar va murakkab savollar."
  };

  /* ---------- 4. Sahifa ---------- */
  var state = { age: "13-17", genre: "Hammasi" };
  try { var a0 = localStorage.getItem("arqana2:age"); if (HINT[a0]) state.age = a0; } catch (e) {}

  function keyOf(game, age) { return "arqana2:" + game.id + ":" + age; }

  function renderFilters() {
    var box = $("filters"); box.innerHTML = "";
    var genres = ["Hammasi"];
    GAMES.forEach(function (g) { if (genres.indexOf(g.genre) === -1) genres.push(g.genre); });
    genres.forEach(function (name) {
      var b = h("button", "chip", name);
      b.setAttribute("aria-pressed", String(name === state.genre));
      b.onclick = function () { state.genre = name; renderFilters(); renderGames(); };
      box.appendChild(b);
    });
  }

  function renderGames() {
    var box = $("games"); box.innerHTML = "";
    var shown = GAMES.filter(function (g) {
      return g.ages.indexOf(state.age) !== -1 && (state.genre === "Hammasi" || g.genre === state.genre);
    });
    if (!shown.length) box.appendChild(h("p", "empty", "Bu turkumda hozircha o‘yin yo‘q."));
    shown.forEach(function (g) {
      var best = load(keyOf(g, state.age));
      var card = h("button", "game");
      card.append(
        h("div", "glyph", g.glyph),
        h("h3", "", g.name),
        h("p", "", g.desc)
      );
      var meta = h("div", "meta");
      meta.append(h("span", "", g.genre + " · " + LEVEL[state.age]));
      var rec = h("span", "", best === null ? "Rekord yo‘q" : "Rekord: ");
      if (best !== null) rec.appendChild(h("b", "", best + " " + g.unit));
      meta.appendChild(rec);
      card.appendChild(meta);
      card.onclick = function () { openGame(g); };
      box.appendChild(card);
    });
  }

  function setAge(age) {
    state.age = age;
    try { localStorage.setItem("arqana2:age", age); } catch (e) {}
    document.body.setAttribute("data-age", age);
    document.querySelectorAll(".age").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.age === age));
    });
    $("age-hint").textContent = HINT[age];
    closeGame();
    renderGames();
  }

  /* O'yin oynasi */
  var cleanup = null, current = null, lastFocus = null;

  function openGame(game) {
    closeGame();
    current = game;
    lastFocus = document.activeElement;
    $("stage-title").textContent = game.name;
    $("stage").hidden = false;
    document.body.style.overflow = "hidden";
    mount();
    $("stage-close").focus();
  }
  function mount() {
    var game = current, age = state.age;
    if (cleanup) cleanup();
    var body = $("stage-body"); body.innerHTML = "";
    var key = keyOf(game, age);
    var ctx = {
      age: age,
      restart: mount,
      record: function (v) {
        var best = load(key);
        var better = best === null || (game.low ? v < best : v > best);
        if (better) save(key, v);
        $("stage-sub").textContent = describe(game, age);
        return better && (game.low || v > 0);
      }
    };
    $("stage-sub").textContent = describe(game, age);
    cleanup = game.run(body, ctx) || null;
  }
  function describe(game, age) {
    var best = load(keyOf(game, age));
    return game.genre + " · " + LEVEL[age] + " daraja · " + (best === null ? "rekord yo‘q" : "rekord: " + best + " " + game.unit);
  }
  function closeGame() {
    if (cleanup) { cleanup(); cleanup = null; }
    if (!$("stage").hidden) {
      $("stage").hidden = true;
      document.body.style.overflow = "";
      $("stage-body").innerHTML = "";
      renderGames();
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    current = null;
  }

  $("stage-close").onclick = closeGame;
  $("stage").addEventListener("click", function (e) { if (e.target === $("stage")) closeGame(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("stage").hidden) closeGame(); });
  document.querySelectorAll(".age").forEach(function (b) { b.onclick = function () { setAge(b.dataset.age); }; });

  renderFilters();
  setAge(state.age);
})();