const { Reputation, Score } = require("./database.js");
const columnify = require('columnify');

class ReputationManager {
	constructor (bot) {
		this.bot = bot;
	}

	get config() { return this.bot.config; } 
	get client() { return this.bot.client; } 
	get sql()    { return this.bot.sql;    }

	async init() {
		Reputation.init(this.sql);
		Score.init(this.sql);
	}

	async handleReaction(reaction, user) {
		if (reaction._emoji.id != this.config.emotes.plusone.id) return;

		await this.giveRep({
			user: reaction.message.author.id,
			delta: 1,
			reason: "Reaction +1",
			giverId: user.id,
			channelId: reaction.message.channel.id,
			messageId: reaction.message.id
		}, reaction.message.channel);
	}

	/**
	 * Handle the event generated when a user posts a new message.
	 * If the message matches one of the tests, give each user mentioned rep.
	 *
	 * @param {Message} message - The message that was posted and needs checked
	 * @return {void}             Returns early if the message doesn't pass the test
	 * @memberof ReputationManager
	 */
	async handleMessage(message) {
		if (!this._testMessage(message)) return;

		for (let user of message.mentions.users) {
			await this._giveMessageRep(user[1], message);
		}
	}

	/**
	 * Determin if a message contains one of the triggers for giving reputation.
	 *
	 * @param {Message} message - A message to test
	 * @return {boolean}          True if the message contains one of the triggers
	 * @memberof ReputationManager
	 */
	async _testMessage(message) {
		return [
			m => /(?<![A-z])thanks?(?![A-z])/gi.test(m.content),               // Contains "thank"
			m => /(?<![A-z])tyvm(?![A-z])/gi.test(m.content),                  // Constains "tyvm"
			m => /(?<![A-z])points? (?:to|for) <@(?![A-z])/gi.test(m.content), // Phrase like "a point to [user]" - think Harry Potter
			m => /:vote:/gi.test(m.content)                                    // The +1 emoji
		].some(test=> test(message));
	}

	/**
	 * Handles giving reputation to a user mentioned in a message
	 *
	 * @param {User}    user    - The user receiving the reputation
	 * @param {Message} message - The message in which the user is being "thanked" or otherwise awarded rep
	 * @return {Reputation}       The new database entry Model
	 * @memberof ReputationManager
	 */
	async _giveMessageRep(user, message) {
		return await this.giveRep({
			user: user.id,
			delta: 1,
			reason: message.content,
			giverId: message.author.id,
			channelId: message.channel.id,
			messageId: message.id
		});
	}
	async handleInteraction() {

	}

	async giveRep(data, channel) {
		const delta = await Reputation.create(data);

		const amount = data.delta == 1 
			? `<:${config.emotes.plusone.name}:${config.emotes.plusone.id}>`
			: data.delta;

		const reply = channel ? await channel.send(
			`Gave **${amount}** ${config.points.name} to <@!${data.user}>`
		) : null;

		return [delta, reply];
	}
}

module.exports.ReputationManager = ReputationManager;
