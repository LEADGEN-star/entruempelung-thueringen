const fs = require("fs");

const template = fs.readFileSync("./generator/template.html", "utf8");
const cities = JSON.parse(fs.readFileSync("./generator/cities.json", "utf8"));

cities.forEach(city => {

  let page = template
    .replaceAll("{{stadt}}", city.stadt)
    .replaceAll("{{slug}}", city.slug);

  fs.writeFileSync(
    `../entrumpelung-${city.slug}.html`,
    page
  );

  console.log(`Erstellt: ${city.stadt}`);

});
