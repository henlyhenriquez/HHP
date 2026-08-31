/* HH Proyectos · Planner — datos en localStorage, sin backend */

const STORAGE_KEY = "hhproyectos_planner_v1";

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function defaultState() {
  const mk = (title) => ({ id: uid(), title, cards: [] });
  const board = {
    id: uid(),
    name: "Proyectos en curso",
    columns: [
      mk("Por hacer"),
      mk("En curso"),
      mk("Revisión"),
      mk("Terminado"),
    ],
  };
  board.columns[0].cards.push(
    {
      id: uid(),
      title: "Levantamiento de obra — Casa Los Robles",
      desc: "Visita en sitio y registro fotográfico previo al anteproyecto.",
      due: "",
      label: "bosque",
      assignee: "HH",
    },
    { id: uid(), title: "Cotizar renders exteriores", desc: "", due: "", label: "", assignee: "" }
  );
  board.columns[1].cards.push({
    id: uid(),
    title: "Planos de gerencia técnica — Edificio Central",
    desc: "Coordinar con estructuras antes del viernes.",
    due: "",
    label: "grafito",
    assignee: "HH",
  });
  return { boards: [board], activeBoardId: board.id };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("No se pudo leer el estado guardado, iniciando de nuevo.", e);
  }
  const fresh = defaultState();
  saveState(fresh);
  return fresh;
}

function saveState(s) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch (e) {
    console.warn("No se pudo guardar el estado.", e);
  }
}

let state = loadState();
let editingCard = null; // { columnId, cardId } | { columnId, cardId: null } for new card

// ---------- helpers ----------
function activeBoard() {
  return state.boards.find((b) => b.id === state.activeBoardId) || state.boards[0];
}

function labelText(v) {
  return { bosque: "Prioritario", grafito: "Interno", claro: "General" }[v] || "";
}

function isOverdue(due) {
  if (!due) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(due + "T00:00:00") < today;
}

function formatDue(due) {
  const [y, m, d] = due.split("-");
  return `${d}/${m}`;
}

// ---------- rendering ----------
const el = {
  boardSelect: document.getElementById("board-select"),
  columns: document.getElementById("columns"),
  search: document.getElementById("search"),
  progressText: document.getElementById("progress-text"),
  progressFill: document.getElementById("progress-fill"),
};

function renderBoardSelect() {
  el.boardSelect.innerHTML = "";
  state.boards.forEach((b) => {
    const opt = document.createElement("option");
    opt.value = b.id;
    opt.textContent = b.name;
    if (b.id === activeBoard().id) opt.selected = true;
    el.boardSelect.appendChild(opt);
  });
}

function renderProgress(board) {
  const doneColumn = board.columns[board.columns.length - 1];
  const total = board.columns.reduce((n, c) => n + c.cards.length, 0);
  const done = doneColumn ? doneColumn.cards.length : 0;
  el.progressText.textContent = total === 0 ? "Sin tarjetas todavía" : `${done} de ${total} completadas`;
  el.progressFill.style.width = total ? `${Math.round((done / total) * 100)}%` : "0%";
}

function cardMatchesSearch(card, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    card.title.toLowerCase().includes(q) ||
    (card.desc || "").toLowerCase().includes(q) ||
    (card.assignee || "").toLowerCase().includes(q)
  );
}

function renderColumns() {
  const board = activeBoard();
  const query = el.search.value.trim();
  el.columns.innerHTML = "";

  board.columns.forEach((col) => {
    const colEl = document.createElement("div");
    colEl.className = "column";
    colEl.dataset.columnId = col.id;

    const header = document.createElement("div");
    header.className = "column-header";

    const titleInput = document.createElement("input");
    titleInput.className = "column-title";
    titleInput.value = col.title;
    titleInput.addEventListener("change", () => {
      col.title = titleInput.value.trim() || col.title;
      saveState(state);
      renderColumns();
    });

    const count = document.createElement("span");
    count.className = "column-count";
    count.textContent = col.cards.length;

    const delBtn = document.createElement("button");
    delBtn.className = "btn-icon column-delete";
    delBtn.textContent = "✕";
    delBtn.title = "Eliminar columna";
    delBtn.addEventListener("click", () => {
      if (col.cards.length && !confirm(`Eliminar la columna "${col.title}" y sus ${col.cards.length} tarjeta(s)?`)) return;
      board.columns = board.columns.filter((c) => c.id !== col.id);
      saveState(state);
      renderAll();
    });

    header.append(titleInput, count, delBtn);

    const list = document.createElement("div");
    list.className = "card-list";
    list.dataset.columnId = col.id;

    list.addEventListener("dragover", (e) => {
      e.preventDefault();
      colEl.classList.add("drag-over");
    });
    list.addEventListener("dragleave", () => colEl.classList.remove("drag-over"));
    list.addEventListener("drop", (e) => {
      e.preventDefault();
      colEl.classList.remove("drag-over");
      const cardId = e.dataTransfer.getData("text/plain");
      moveCard(cardId, col.id);
    });

    col.cards.filter((c) => cardMatchesSearch(c, query)).forEach((card) => {
      list.appendChild(renderCard(card, col));
    });

    const addBtn = document.createElement("button");
    addBtn.className = "add-card-btn";
    addBtn.textContent = "+ Agregar tarjeta";
    addBtn.addEventListener("click", () => openCardModal(col.id, null));

    colEl.append(header, list, addBtn);
    el.columns.appendChild(colEl);
  });

  renderProgress(board);
}

function renderCard(card, col) {
  const c = document.createElement("div");
  c.className = "card";
  c.draggable = true;
  c.dataset.cardId = card.id;

  c.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", card.id);
    c.classList.add("dragging");
  });
  c.addEventListener("dragend", () => c.classList.remove("dragging"));
  c.addEventListener("click", () => openCardModal(col.id, card.id));

  if (card.label) {
    const lab = document.createElement("span");
    lab.className = `card-label ${card.label}`;
    lab.textContent = labelText(card.label);
    c.appendChild(lab);
  }

  const title = document.createElement("div");
  title.className = "card-title";
  title.textContent = card.title;
  c.appendChild(title);

  if (card.due || card.assignee) {
    const meta = document.createElement("div");
    meta.className = "card-meta";

    const due = document.createElement("span");
    if (card.due) {
      due.className = "card-due" + (isOverdue(card.due) ? " overdue" : "");
      due.textContent = formatDue(card.due);
    }
    meta.appendChild(due);

    if (card.assignee) {
      const who = document.createElement("span");
      who.className = "card-assignee";
      who.textContent = card.assignee;
      meta.appendChild(who);
    }
    c.appendChild(meta);
  }

  return c;
}

function moveCard(cardId, targetColumnId) {
  const board = activeBoard();
  let card = null;
  board.columns.forEach((c) => {
    const idx = c.cards.findIndex((x) => x.id === cardId);
    if (idx !== -1) {
      card = c.cards.splice(idx, 1)[0];
    }
  });
  if (!card) return;
  const target = board.columns.find((c) => c.id === targetColumnId);
  target.cards.push(card);
  saveState(state);
  renderColumns();
}

function renderAll() {
  renderBoardSelect();
  renderColumns();
}

// ---------- card modal ----------
const modal = document.getElementById("card-modal");
const inputTitle = document.getElementById("card-title-input");
const inputDesc = document.getElementById("card-desc-input");
const inputDue = document.getElementById("card-due-input");
const inputLabel = document.getElementById("card-label-input");
const inputAssignee = document.getElementById("card-assignee-input");
const deleteBtn = document.getElementById("card-delete-btn");

function openCardModal(columnId, cardId) {
  const board = activeBoard();
  const col = board.columns.find((c) => c.id === columnId);
  const card = cardId ? col.cards.find((c) => c.id === cardId) : null;

  editingCard = { columnId, cardId };
  inputTitle.value = card ? card.title : "";
  inputDesc.value = card ? card.desc || "" : "";
  inputDue.value = card ? card.due || "" : "";
  inputLabel.value = card ? card.label || "" : "";
  inputAssignee.value = card ? card.assignee || "" : "";
  deleteBtn.style.display = card ? "inline-block" : "none";

  modal.classList.remove("hidden");
  setTimeout(() => inputTitle.focus(), 0);
}

function closeCardModal() {
  modal.classList.add("hidden");
  editingCard = null;
}

function saveCardModal() {
  if (!editingCard) return;
  const title = inputTitle.value.trim();
  if (!title) {
    inputTitle.focus();
    return;
  }
  const board = activeBoard();
  const col = board.columns.find((c) => c.id === editingCard.columnId);
  let card = editingCard.cardId ? col.cards.find((c) => c.id === editingCard.cardId) : null;

  if (!card) {
    card = { id: uid() };
    col.cards.push(card);
  }
  card.title = title;
  card.desc = inputDesc.value.trim();
  card.due = inputDue.value;
  card.label = inputLabel.value;
  card.assignee = inputAssignee.value.trim();

  saveState(state);
  closeCardModal();
  renderColumns();
}

function deleteCardModal() {
  if (!editingCard || !editingCard.cardId) return;
  const board = activeBoard();
  const col = board.columns.find((c) => c.id === editingCard.columnId);
  col.cards = col.cards.filter((c) => c.id !== editingCard.cardId);
  saveState(state);
  closeCardModal();
  renderColumns();
}

document.getElementById("card-modal-close").addEventListener("click", closeCardModal);
document.getElementById("card-save-btn").addEventListener("click", saveCardModal);
deleteBtn.addEventListener("click", () => {
  if (confirm("¿Eliminar esta tarjeta?")) deleteCardModal();
});
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeCardModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modal.classList.contains("hidden")) closeCardModal();
});

// ---------- boards ----------
el.boardSelect.addEventListener("change", () => {
  state.activeBoardId = el.boardSelect.value;
  saveState(state);
  renderColumns();
});

document.getElementById("btn-new-board").addEventListener("click", () => {
  const name = prompt("Nombre del nuevo tablero:", "Nuevo tablero");
  if (!name) return;
  const mk = (title) => ({ id: uid(), title, cards: [] });
  const board = {
    id: uid(),
    name: name.trim(),
    columns: [mk("Por hacer"), mk("En curso"), mk("Revisión"), mk("Terminado")],
  };
  state.boards.push(board);
  state.activeBoardId = board.id;
  saveState(state);
  renderAll();
});

document.getElementById("btn-rename-board").addEventListener("click", () => {
  const board = activeBoard();
  const name = prompt("Renombrar tablero:", board.name);
  if (!name) return;
  board.name = name.trim();
  saveState(state);
  renderAll();
});

document.getElementById("btn-delete-board").addEventListener("click", () => {
  if (state.boards.length <= 1) {
    alert("Debe quedar al menos un tablero.");
    return;
  }
  const board = activeBoard();
  if (!confirm(`¿Eliminar el tablero "${board.name}" y todo su contenido?`)) return;
  state.boards = state.boards.filter((b) => b.id !== board.id);
  state.activeBoardId = state.boards[0].id;
  saveState(state);
  renderAll();
});

// ---------- columns ----------
document.getElementById("btn-new-column").addEventListener("click", () => {
  const name = prompt("Nombre de la nueva columna:", "Nueva columna");
  if (!name) return;
  activeBoard().columns.push({ id: uid(), title: name.trim(), cards: [] });
  saveState(state);
  renderColumns();
});

// ---------- search ----------
el.search.addEventListener("input", () => renderColumns());

// ---------- init ----------
renderAll();
