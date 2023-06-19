import { createAppAuth } from "@octokit/auth-app";
import { Octokit as ExtendableOctokit } from "@octokit/core";

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
		super({ userAgent, auth: options, authStrategy: createAppAuth });

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
