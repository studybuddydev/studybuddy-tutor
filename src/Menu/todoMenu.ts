import { Menu, MenuRange } from "@grammyjs/menu";
import { MyContext } from './../utils/types';
import logger from 'euberlog';
// settingsmenu used to handle notification of the bot


export const todoMenu = new Menu<MyContext>("todo-menu")
  .text(
    "add todo",
    (ctx) => {
      //edit message 
      //ctx.session.todo?.push(ctx.message?.text || '');
     //   }catch (e) { console.log(e)} 
      ctx.reply('/todo todo da aggiungere')
    },
  ).submenu("elimina", 'delete-todo').row() 

const addTodoMenu = new Menu<MyContext>("add-todo")

  .text( 
    "aggiungi",
    async (ctx) => {
      await ctx.session.todo?.push(ctx.message?.text || '');
    }
  ).row()
  .back("Go Back");


const deleteTodoMenu = new Menu<MyContext>("delete-todo")
  .dynamic(async (ctx) => {
    // Generate a part of the menu dynamically!
    const range = new MenuRange<MyContext>();

    ctx.session.todo?.forEach((todo, index) => {
      range
        .text((todo).toString(), (ctx) => {
          ctx.session.todo?.splice(index, 1) 
          ctx.menu.update();

          let msg = 'hai ' + ctx.session.todo?.length + ' cose da fare: \n'
          ctx.session.todo?.forEach((todo, index) => {
              msg += `\n${index + 1}. ${todo}`;
          });
          ctx.editMessageText(msg)
          ctx.answerCallbackQuery({text: "todo eliminato",});
        
        })
  });



  return range;
})



todoMenu.register(addTodoMenu);
todoMenu.register(deleteTodoMenu);



