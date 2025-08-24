import { Request, Response } from 'express';
import { Pool } from 'pg';
import crypto from 'crypto';

export class TokensController {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  generateTokenCode = (): string => {
    const prefix = 'ONX';
    const randomString = crypto.randomBytes(6).toString('hex').toUpperCase();
    return `${prefix}-${randomString.slice(0, 4)}-${randomString.slice(4, 8)}-${randomString.slice(8)}`;
  };

  createToken = async (req: Request, res: Response) => {
    try {
      const { organization_name, expires_in_days = 30 } = req.body;
      const created_by = (req as any).user?.id;

      // For MVP: Allow all admin users to create tokens
      if ((req as any).user?.role !== 'admin') {
        return res.status(403).json({ error: 'Only admin users can create tokens' });
      }

      const code = this.generateTokenCode();
      const expires_at = new Date();
      expires_at.setDate(expires_at.getDate() + expires_in_days);

      const query = `
        INSERT INTO tokens (code, organization_name, expires_at, created_by, status)
        VALUES ($1, $2, $3, $4, 'active')
        RETURNING *
      `;

      const result = await this.pool.query(query, [code, organization_name, expires_at, created_by]);
      res.json({ token: result.rows[0] });
    } catch (error) {
      console.error('Error creating token:', error);
      res.status(500).json({ error: 'Failed to create token' });
    }
  };

  validateToken = async (req: Request, res: Response) => {
    try {
      const { code } = req.body;

      const query = `
        SELECT * FROM tokens 
        WHERE code = $1 
        AND status = 'active' 
        AND expires_at > NOW()
      `;

      const result = await this.pool.query(query, [code]);

      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid or expired token' });
      }

      res.json({ valid: true, token: result.rows[0] });
    } catch (error) {
      console.error('Error validating token:', error);
      res.status(500).json({ error: 'Failed to validate token' });
    }
  };

  listTokens = async (req: Request, res: Response) => {
    try {
      // For MVP: Allow all admin users to view tokens
      if ((req as any).user?.role !== 'admin') {
        return res.status(403).json({ error: 'Only admin users can view tokens' });
      }

      const query = `
        SELECT t.*, u.email as used_by_email, creator.email as created_by_email
        FROM tokens t
        LEFT JOIN users u ON t.used_by = u.id
        LEFT JOIN users creator ON t.created_by = creator.id
        ORDER BY t.created_at DESC
      `;

      const result = await this.pool.query(query);
      res.json({ tokens: result.rows });
    } catch (error) {
      console.error('Error listing tokens:', error);
      res.status(500).json({ error: 'Failed to list tokens' });
    }
  };

  revokeToken = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // For MVP: Allow all admin users to revoke tokens
      if ((req as any).user?.role !== 'admin') {
        return res.status(403).json({ error: 'Only admin users can revoke tokens' });
      }

      const query = `
        UPDATE tokens 
        SET status = 'expired' 
        WHERE id = $1 
        RETURNING *
      `;

      const result = await this.pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Token not found' });
      }

      res.json({ token: result.rows[0] });
    } catch (error) {
      console.error('Error revoking token:', error);
      res.status(500).json({ error: 'Failed to revoke token' });
    }
  };

  markTokenAsUsed = async (tokenId: string, userId: string, client: any) => {
    const query = `
      UPDATE tokens 
      SET status = 'used', used_by = $1, used_at = NOW() 
      WHERE id = $2
    `;
    await client.query(query, [userId, tokenId]);
  };
}

export default TokensController;