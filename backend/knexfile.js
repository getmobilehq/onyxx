"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const config = {
    development: {
        client: 'pg',
        connection: process.env.DATABASE_URL || {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'onyx_dev',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres'
        },
        migrations: {
            directory: './src/database/migrations',
            extension: 'ts'
        },
        seeds: {
            directory: './src/database/seeds',
            extension: 'ts'
        }
    },
    production: {
        client: 'pg',
        connection: {
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        },
        migrations: {
            directory: './dist/database/migrations',
            extension: 'js'
        },
        seeds: {
            directory: './dist/database/seeds',
            extension: 'js'
        },
        pool: {
            min: 2,
            max: 10
        }
    },
    test: {
        client: 'pg',
        connection: process.env.TEST_DATABASE_URL || {
            host: 'localhost',
            port: 5432,
            database: 'onyx_test',
            user: 'postgres',
            password: 'postgres'
        },
        migrations: {
            directory: './src/database/migrations',
            extension: 'ts'
        },
        seeds: {
            directory: './src/database/seeds',
            extension: 'ts'
        }
    }
};
exports.default = config;
//# sourceMappingURL=knexfile.js.map