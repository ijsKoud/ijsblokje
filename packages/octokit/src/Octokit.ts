import { createAppAuth } from "@octokit/auth-app";
import { Octokit as CoreOctokit } from "@octokit/core";
import { throttling } from "@octokit/plugin-throttling";

const ExtendableOctokit = CoreOctokit.plugin(throttling) as typeof CoreOctokit;

export class Octokit extends ExtendableOctokit {
	/** The id of the GitHub application */
	public readonly appId: number;

	/** The GitHub private key for signing data */
	public readonly privateKey: string;

	/** The GitHub client id */
	public readonly clientId: string;

	/** The GitHub client secret */
	public readonly clientSecret: string;

	/** The installation id */
	public readonly installationId?: number;

	/** The request user-agent */
	public readonly userAgent: string;

	public get options() {
		return {
			appId: this.appId,
			privateKey: this.privateKey,
			clientId: this.clientId,
			clientSecret: this.clientSecret,
			installationId: this.installationId
		};
	}

	public constructor(options: OctokitOptions) {
		const userAgent = "@ijsblokje/octokit (https://github.com/ijsKoud/ijsblokje)";

		super({
			userAgent,
			auth: options,
			authStrategy: createAppAuth,
			throttle: {
				enabled: true,
				onRateLimit: Octokit.onRateLimit.bind(Octokit),
				onSecondaryRateLimit: Octokit.onSecondaryRateLimit.bind(Octokit),
				id: options.appId.toString()
			}
		});

		this.userAgent = userAgent;
		this.appId = options.appId;
		this.privateKey = options.privateKey;
		this.clientId = options.clientId;
		this.clientSecret = options.clientSecret;
		this.installationId = options.installationId;
	}

	/**
	 * Returns a cloned version of this octokit instance with (optionally) mutated options
	 * @param options The Constructor options
	 * @returns
	 */
	public new(options?: Partial<OctokitOptions>) {
		const constructorOptions = options ? Object.assign({}, this.options, options) : this.options;
		return new Octokit(constructorOptions);
	}

	/**
	 * First ratelimit event handler
	 * @param retryAfter The amount of seconds Octokit has to wait
	 * @param options The request options
	 * @param octokit The CoreOctokit instance
	 * @param retryCount The amount of retries
	 * @returns
	 */
	public static onRateLimit(retryAfter: number, options: Record<string, any>, octokit: CoreOctokit, retryCount: number) {
		octokit.log.warn(`Request quota exhausted for request ${options.method} ${options.url}`);

		if (retryCount < 1) {
			// only retries once
			octokit.log.info(`Retrying after ${retryAfter} seconds!`);
			return true;
		}

		return false;
	}

	/**
	 * The secondary ratelimit handler
	 * @param retryAfter The amount of seconds Octokit has to wait
	 * @param options The request options
	 * @param octokit The Coreoctokit instance
	 */
	public static onSecondaryRateLimit(retryAfter: number, options: Record<string, any>, octokit: CoreOctokit) {
		octokit.log.warn(`SecondaryRateLimit detected for request ${options.method} ${options.url}`);
	}
}

export interface OctokitOptions {
	/** The id of the GitHub application */
	appId: number;

	/** The GitHub private key for signing data */
	privateKey: string;

	/** The GitHub client id */
	clientId: string;

	/** The GitHub client secret */
	clientSecret: string;

	/** The installation id */
	installationId?: number;
}
