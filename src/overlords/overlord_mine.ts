import {Overlord} from './Overlord';
import {MinerSetup} from '../creepSetup/defaultSetups';
import {Priority} from '../config/priorities';
import {MiningSite} from '../hiveClusters/hiveCluster_miningSite';
import {Zerg} from '../Zerg';
import {Tasks} from '../tasks/Tasks';

export class MiningOverlord extends Overlord {

	miners: Zerg[];
	miningSite: MiningSite;

	constructor(miningSite: MiningSite, priority = Priority.NormalHigh) {
		super(miningSite, 'mine', priority);
		this.miners = this.creeps('miner');
		this.miningSite = miningSite;
	}

	spawn() {
		let miningPowerAssigned = _.sum(_.map(this.lifetimeFilter(this.miners),
											  creep => creep.getActiveBodyparts(WORK)));
		if (miningPowerAssigned < this.miningSite.miningPowerNeeded) {
			this.requestCreep(new MinerSetup());
		}
	}

	init() {
		this.spawn();
	}

	private handleMiner(miner: Zerg): void {
		// Ensure you are in the assigned room
		if (miner.room == this.room && !miner.pos.isEdge) {
			// Harvest if out of energy
			if (miner.carry.energy == 0) {
				miner.task = Tasks.harvest(this.miningSite.source);
			}
			// Else see if there is an output to depsit to or to maintain
			else if (this.miningSite.output) {
				if (this.miningSite.output.hits < this.miningSite.output.hitsMax) {
					miner.task = Tasks.repair(this.miningSite.output);
				} else {
					miner.task = Tasks.deposit(this.miningSite.output);
				}
			}
			// Else build the output if there is a constructionSite (placement handled by miningSite)
			else {
				if (this.miningSite.outputConstructionSite) {
					miner.task = Tasks.build(this.miningSite.outputConstructionSite);
				}
			}
		} else {
			miner.task = Tasks.goTo(this.miningSite);
		}
	}

	run() {
		for (let miner of this.miners) {
			if (miner.isIdle) {
				this.handleMiner(miner);
			}
			miner.run();
		}
	}
}
