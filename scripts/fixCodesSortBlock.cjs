const fs = require("fs");
const path = require("path");

const filePath = path.join(process.cwd(), "app", "codes", "page.tsx");

let content = fs.readFileSync(filePath, "utf8");

const startMarker = "function promoMatchesExpiry(";
const endMarker = "function MobilePromoTile";

const start = content.indexOf(startMarker);
const end = content.indexOf(endMarker, start);

if (start === -1) {
  console.error("Не знайшов function promoMatchesExpiry");
  process.exit(1);
}

if (end === -1) {
  console.error("Не знайшов function MobilePromoTile");
  process.exit(1);
}

const replacement = `function promoMatchesExpiry(promo: Promo, expiryFilter: ExpiryFilter) {
  if (expiryFilter === "all") return true;

  const daysLeft = getDaysLeft(promo.expires_at);

  if (expiryFilter === "no_expiry") return daysLeft === null;
  if (expiryFilter === "expired") return daysLeft !== null && daysLeft < 0;

  if (expiryFilter === "ending") {
    return daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;
  }

  if (expiryFilter === "active") {
    return daysLeft === null || daysLeft >= 0;
  }

  return true;
}

function sortPromos(promos: Promo[], sortMode: SortMode) {
  return [...promos].sort((firstPromo, secondPromo) => {
    if (sortMode === "oldest") {
      return (
        new Date(firstPromo.created_at || 0).getTime() -
        new Date(secondPromo.created_at || 0).getTime()
      );
    }

    if (sortMode === "ending") {
      const firstDays = getDaysLeft(firstPromo.expires_at);
      const secondDays = getDaysLeft(secondPromo.expires_at);

      if (firstDays === null && secondDays === null) return 0;
      if (firstDays === null) return 1;
      if (secondDays === null) return -1;

      return firstDays - secondDays;
    }

    if (sortMode === "reliable") {
      return (
        Number(getWorksPercent(secondPromo) || 0) -
        Number(getWorksPercent(firstPromo) || 0)
      );
    }

    if (sortMode === "works") {
      return (
        Number(secondPromo.works_count || 0) -
        Number(firstPromo.works_count || 0)
      );
    }

    if (sortMode === "store") {
      return (firstPromo.store_name || "").localeCompare(
        secondPromo.store_name || ""
      );
    }

    return (
      new Date(secondPromo.created_at || 0).getTime() -
      new Date(firstPromo.created_at || 0).getTime()
    );
  });
}

`;

content = content.slice(0, start) + replacement + content.slice(end);

fs.writeFileSync(filePath, content, "utf8");

console.log("Fixed promoMatchesExpiry and sortPromos block");
console.log("Now run: npm run build");
