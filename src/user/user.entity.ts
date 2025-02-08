// src/user/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, BeforeUpdate } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UUID } from 'crypto';
import { ConflictException } from '@nestjs/common';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user', // noob
  MODERATOR = 'moderator',
}

@Entity()
export class User {
  @Column({ unique: true })
  @PrimaryGeneratedColumn('uuid',) // Gera UUID automaticamente
  id: string;

  @Column() // O username deve ser único
  username: string;

  @Column({ unique: true }) // O email também deve ser único
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  lastUpdateAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  wasDeletedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  lastActivityAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  lastSessionAt: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  sessionMetadata: Record<string, any>;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.password) {
      // Gera um sal separado para maior clareza e legibilidade
      const salt = await bcrypt.genSalt(10); // 10 é o número de salt rounds
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  /**
   * Valida a senha fornecida comparando com o hash armazenado
   * @param password - Senha em texto plano fornecida pelo usuário
   * @returns boolean - True se a senha for válida, caso contrário False
   */
  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  /**
   * Desativa o usuário, marcando-o como inativo e deletado
   */
  deactivate(): void {
    this.isActive = false;
    this.isDeleted = false;
    this.lastActivityAt = new Date();
  }

  delete(): void {
    if (this.isDeleted) throw new ConflictException('User is already deleted.');
    this.isActive = false;
    this.isDeleted = true;
    this.wasDeletedAt = new Date();
  }
  /**
   * Ativa o usuário, revertendo as marcações de inatividade e exclusão
   */
  activate(): void {
    this.isActive = true;
    this.isDeleted = false;
  }

  /**
   * Atualiza a data do último login para a data/hora atual
   */
  markLastLogin(): void {
    this.lastLoginAt = new Date();
  }
}
