import { getMenuFor$ } from './db/recipes-repository';

getMenuFor$(2, 2)
.subscribe(
  (menus) => console.log(Object.entries(menus.shoppingList).map(([ingredient, quantity]) => (`${quantity.amount} ${quantity.uom} ${ingredient}`)).join('\n')),
  (err) => console.error('Cannot get menus: ', err)
);