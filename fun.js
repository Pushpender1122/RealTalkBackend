
module.exports.mapTheUsers = (clients, idToUser) => {
    try {

        const number = Math.floor(Math.random() * clients.length);
        // console.log("first in the user map " + clients)
        const user1 = clients.splice(number, 1)[0];
        // console.log("Second in the user map " + clients)
        const number2 = Math.floor(Math.random() * (clients.length - 1)); // Adjusted to avoid out-of-bound index
        const user2 = clients.splice(number2, 1)[0];

        idToUser.set(user1, user2);
        idToUser.set(user2, user1);
        // userToId.set(user1, user2);
        // userToId.set(user2, user1);
    } catch (error) {
        console.log(error);
    }
};
