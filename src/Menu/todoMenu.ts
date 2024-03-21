import { Menu, MenuRange } from "@grammyjs/menu";
import { MyContext } from './../utils/types';
import logger from 'euberlog';
// settingsmenu used to handle notification of the bot


async function editMsgDelete(ctx: MyContext) {

    if (!ctx.from) return



    //get current message
    let msg = 'hai ' + ctx.session.todo?.length + ' cose da fare: \n'
    ctx.session.todo?.forEach((todo, index) => {
        msg += `\n${index + 1}. ${todo}`;
    });

    try {
        await ctx.editMessageText(msg + '\n\n seleziona il todo da eliminare');
    } catch (e) {
        logger.warning(e as string);
    }
}

export const todoMenu = new Menu<MyContext>("todo-menu")
    .text(
        "add todo",
        (ctx) => {
            //edit message 
            //ctx.session.todo?.push(ctx.message?.text || '');
            //   }catch (e) { console.log(e)} 
            ctx.reply('/todo todo da aggiungere')
        },
    ).submenu("elimina", 'delete-todo', editMsgDelete).row()

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

        // append to the message " select the todo to delete"


        ctx.session.todo?.forEach((todo, index) => {
            range
                .text((index+1).toString(), (ctx) => {
                    ctx.session.todo?.splice(index, 1)
                    ctx.menu.update();

                    let msg = 'hai ' + ctx.session.todo?.length + ' cose da fare: \n'
                    ctx.session.todo?.forEach((todo, index) => {
                        msg += `\n${index + 1}. ${todo}`;
                    });
                    ctx.editMessageText(msg)
                    ctx.answerCallbackQuery({ text: "todo eliminato", });

                })
        });




        return range;
    }).row()
    .back("Go Back");



todoMenu.register(addTodoMenu);
todoMenu.register(deleteTodoMenu);



