import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { findAll$, Identifiable } from './db-json';

interface Quantifiable {
  amount: number;
  uom: string;
}
export interface Ingredient extends Quantifiable {
  name: string;
}
export interface Recipe extends Identifiable {
  name: string;
  type: 'recipe';
  ingredients: Ingredient[];
  servings: number;
}

export interface ShoppingList {
  [ingredientName: string]: Quantifiable;
}

export interface Menu {
  recipes: Recipe[];
  shoppingList: ShoppingList;
}

export function findAllRecipes$(): Observable<Recipe[]> {
  return findAll$('recipe');
}

export function getMenuFor$(days: number, servings: number): Observable<Menu> {
  const MEALS_PER_DAY = 2;

  return findAllRecipes$().pipe(
    map((recipes) => {
      const menus = [];
      for (let i = 0; i < days * MEALS_PER_DAY; i++) {
        // menus.push(recipes[Math.floor(Math.random() * recipes.length)]);
        menus.push(recipes[i]);
      }
      return menus;
    }),
    map(toMenu(servings))
  );
}

function toMenu(servings: number): (recipes: Recipe[]) => Menu {
  return (recipes: Recipe[]) => ({
    recipes,
    shoppingList: recipes
      .map((menu) => ({ servings: menu.servings, ingredients: menu.ingredients }))
      .reduce((prev, next) => {
        next.ingredients.forEach((ingredient) => {
          const scaledAmount = scaleByServing(ingredient.amount, next.servings, servings);
          if (prev[ingredient.name] !== undefined) {
            prev[ingredient.name].amount += scaledAmount;
          } else {
            prev[ingredient.name] = { amount: scaledAmount, uom: ingredient.uom };
          }
        });
        return prev;
      }, {} as ShoppingList),
  });
}

function scaleByServing(ingredientAmount: number, servings: number, desiredServings: number) {
  return (ingredientAmount / servings) * desiredServings;
}
