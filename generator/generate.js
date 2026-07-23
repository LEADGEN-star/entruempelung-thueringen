git add generator/generate.jsconst fs = require("fs");

const template = fs.readFileSync("./generator/template.html", "utf8");
const cities = JSON.parse(fs.readFileSync("./generator/cities.json", "utf8"));
<<<<<<< HEAD

=======
>>>>>>> 572b444 (Add city data fields to generator)
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
git add generator/generate.js
git rebase --continue





