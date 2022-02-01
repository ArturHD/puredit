// Example code
import { db } from "dsl";

let test = "Hello" + "World";

function x(input: number, name: string) {
  console.log("Hello world!");
  if (true) {
    while (2 < 1) {
      db.change("rooms", (table) => {
        // A quick comment
        table.column("lastName").replace("Mister ", "Mr. ");
        console.log("Mixing projections with code");
        table.column("firstName").trim("both");
      });
    }
  }
}

db.change("students", (table) => {
  table.column("name").replace("Mister", "Mr.");
  table.column("lastName").trim("right");
});

let y = 42;
y + 10;

if (y > 42) {
  let x = 3;
}
