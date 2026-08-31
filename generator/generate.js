const fs = require("fs");

const template = fs.readFileSync("./generator/template.html", "utf8");
const cities = JSON.parse(fs.readFileSync("./generator/cities.json", "utf8"));

cities.forEach(city => {

  let page = template
    .replaceAll("{{stadt}}", city.stadt)
    .replaceAll("{{slug}}", city.slug)
    .replaceAll("{{ortsteile}}", city.ortsteile)
    .replaceAll("{{besonderheit}}", city.besonderheit || "")
    .replaceAll("{{lokaler_text}}", city.lokaler_text || "")
    .replaceAll("{{typische_auftraege}}", city.typische_auftraege || "")
    .replaceAll("{{beschreibung}}", city.beschreibung || "")
    .replaceAll("{{preis}}", city.preis || "");

  fs.writeFileSync(
    `entruempelung-${city.slug}.html`,
    page
  );

  console.log(`Erstellt: ${city.stadt}`);
});
