const _state = {
  tab: "beers",
  type: "all",
  brewery: "all",
  gluten: false,
  data: { beers: [], softs: [] }
};

const _tabs = [
  { key: "beers", label: "Bières" },
  { key: "softs", label: "Softs" }
];

function _el(tagName, className, text) {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function _formatPrice(value) {
  return Number(value).toFixed(2);
}

function _formatAbv(value) {
  return Number(value).toFixed(1).replace(".", ",") + " %";
}

function _uniqueValues(items, key) {
  const values = new Set(items.map((item) => item[key]).filter(Boolean));
  return [...values].sort((a, b) => a.localeCompare(b, "fr"));
}

function _renderTabs() {
  const container = document.getElementById("tabs");
  container.replaceChildren();
  _tabs.forEach((tab) => {
    const button = _el("button", "Tab", tab.label);
    button.type = "button";
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", String(_state.tab === tab.key));
    button.addEventListener("click", () => {
      _state.tab = tab.key;
      _state.type = "all";
      _state.brewery = "all";
      _state.gluten = false;
      _render();
    });
    container.appendChild(button);
  });
}

function _renderFilters() {
  const container = document.getElementById("filters");
  container.replaceChildren();
  const items = _state.data[_state.tab];
  const makerKey = _state.tab === "beers" ? "brewery" : "brand";

  const types = ["all", ..._uniqueValues(items, "type")];
  const chips = _el("div", "Chips");
  types.forEach((typeName) => {
    const label = typeName === "all" ? "Toutes" : typeName;
    const chip = _el("button", "Chip", label);
    chip.type = "button";
    if (_state.type === typeName) chip.classList.add("Active");
    chip.addEventListener("click", () => {
      _state.type = typeName;
      _renderFilters();
      _renderList();
    });
    chips.appendChild(chip);
  });
  const glutenChip = _el("button", "Chip", "Sans gluten");
  glutenChip.type = "button";
  glutenChip.setAttribute("aria-pressed", String(_state.gluten));
  if (_state.gluten) glutenChip.classList.add("Active");
  glutenChip.addEventListener("click", () => {
    _state.gluten = !_state.gluten;
    _renderFilters();
    _renderList();
  });
  chips.appendChild(glutenChip);
  container.appendChild(chips);

  const select = _el("select", "Select");
  select.setAttribute("aria-label", _state.tab === "beers" ? "Brasserie" : "Marque");
  const allOption = _el("option", "", _state.tab === "beers" ? "Toutes les brasseries" : "Toutes les marques");
  allOption.value = "all";
  select.appendChild(allOption);
  _uniqueValues(items, makerKey).forEach((breweryName) => {
    const option = _el("option", "", breweryName);
    option.value = breweryName;
    select.appendChild(option);
  });
  select.value = _state.brewery;
  select.addEventListener("change", () => {
    _state.brewery = select.value;
    _renderList();
  });
  container.appendChild(select);
}

function _buildItem(item, isBeer) {
  const row = _el("article", "Item");
  if (item.available === false) row.classList.add("Unavailable");

  const left = _el("div");
  const nameRow = _el("div", "ItemName", item.name);
  if (item.glutenFree) {
    const icon = _el("img", "GlutenIcon");
    icon.src = "images/gluten.png";
    icon.alt = "Sans gluten";
    icon.title = "Sans gluten";
    nameRow.appendChild(icon);
  }
  left.appendChild(nameRow);
  const metaParts = [];
  const maker = isBeer ? item.brewery : item.brand;
  if (maker) metaParts.push(maker);
  if (item.type) metaParts.push(item.type);
  if (isBeer) {
    if (item.abv !== undefined && item.abv !== null) metaParts.push(_formatAbv(item.abv));
  }
  if (metaParts.length > 0) left.appendChild(_el("div", "ItemMeta", metaParts.join(" · ")));
  if (item.deposit) {
    left.appendChild(_el("div", "Deposit", "consigné"));
  }
  row.appendChild(left);

  const right = _el("div", "ItemPrice");
  if (item.price !== null && item.price !== undefined) right.appendChild(_el("div", "", _formatPrice(item.price)));
  if (item.size) right.appendChild(_el("div", "ItemMeta", item.size));
  if (item.available === false) right.appendChild(_el("span", "Sold", "Épuisé"));
  row.appendChild(right);

  return row;
}

function _renderList() {
  const container = document.getElementById("list");
  container.replaceChildren();
  const isBeer = _state.tab === "beers";
  let items = _state.data[_state.tab] || [];

  const makerKey = isBeer ? "brewery" : "brand";
  items = items.filter((item) => {
    const typeOk = _state.type === "all" || item.type === _state.type;
    const makerOk = _state.brewery === "all" || item[makerKey] === _state.brewery;
    const glutenOk = !_state.gluten || item.glutenFree === true;
    return typeOk && makerOk && glutenOk;
  });

  items = [...items].sort((a, b) => {
    const soldA = a.available === false ? 1 : 0;
    const soldB = b.available === false ? 1 : 0;
    return soldA - soldB || Number(a.price) - Number(b.price);
  });

  if (items.length === 0) {
    container.appendChild(_el("div", "Empty", "Rien à afficher ici."));
    return;
  }
  items.forEach((item) => container.appendChild(_buildItem(item, isBeer)));
}

function _render() {
  _renderTabs();
  _renderFilters();
  _renderList();
}

async function Init() {
  try {
    const response = await fetch("menu.json", { cache: "no-store" });
    if (!response.ok) throw new Error("http " + response.status);
    const json = await response.json();
    _state.data.beers = Array.isArray(json.beers) ? json.beers : [];
    _state.data.softs = Array.isArray(json.softs) ? json.softs : [];
  } catch (error) {
    document.getElementById("list").replaceChildren(
      _el("div", "Empty", "Impossible de charger la carte, réessaie dans un instant.")
    );
    return;
  }
  _render();
}

Init();
