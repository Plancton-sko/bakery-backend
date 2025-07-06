// src/customer/customer.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dtos/create-customer.dto';
import { UpdateCustomerDto } from './dtos/update-customer.dto';

@Injectable()
export class CustomersService {
    constructor(
        @InjectRepository(Customer)
        private readonly customerRepository: Repository<Customer>,

    ) { }
    private readonly logger: Logger;
    async create(createCustomerDto: CreateCustomerDto) {
        try {
            // Verificar se cliente já existe com mesmo email
            const existingCustomer = await this.customerRepository.findOne({
                where: { email: createCustomerDto.email }
            });

            if (existingCustomer) {
                return existingCustomer;
            }

            const customer = this.customerRepository.create(createCustomerDto);
            return await this.customerRepository.save(customer);
        } catch (error) {
            // Corrigido: verificar o tipo de error antes de acessar a propriedade message
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            const errorStack = error instanceof Error ? error.stack : '';
            this.logger.error(`Erro ao criar cliente: ${errorMessage}`, errorStack);
            throw error;
        }
    }

    async findAll(search?: string) {
        try {
            if (search) {
                return await this.customerRepository.find({
                    where: [
                        { firstName: ILike(`%${search}%`) },
                        { lastName: ILike(`%${search}%`) },
                        { email: ILike(`%${search}%`) }
                    ],
                    order: { createdAt: 'DESC' }
                });
            }

            return await this.customerRepository.find({
                order: { createdAt: 'DESC' }
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            const errorStack = error instanceof Error ? error.stack : '';
            this.logger.error(`Erro ao buscar clientes: ${errorMessage}`, errorStack);
            throw error;
        }
    }

    async findOne(id: string) {
        try {
            const customer = await this.customerRepository.findOne({
                where: { id },
                relations: ['orders']
            });

            if (!customer) {
                throw new NotFoundException(`Cliente com ID ${id} não encontrado`);
            }

            return customer;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            const errorStack = error instanceof Error ? error.stack : '';
            this.logger.error(`Erro ao buscar cliente: ${errorMessage}`, errorStack);
            throw error;
        }
    }

    async findByEmail(email: string) {
        try {
            return await this.customerRepository.findOne({
                where: { email }
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            const errorStack = error instanceof Error ? error.stack : '';
            this.logger.error(`Erro ao buscar cliente por email: ${errorMessage}`, errorStack);
            throw error;
        }
    }

    async update(id: string, updateCustomerDto: UpdateCustomerDto) {
        try {
            const customer = await this.findOne(id);

            this.customerRepository.merge(customer, updateCustomerDto);
            return await this.customerRepository.save(customer);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            const errorStack = error instanceof Error ? error.stack : '';
            this.logger.error(`Erro ao atualizar cliente: ${errorMessage}`, errorStack);
            throw error;
        }
    }

    async remove(id: string) {
        try {
            const customer = await this.findOne(id);
            await this.customerRepository.remove(customer);
            return { deleted: true };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            const errorStack = error instanceof Error ? error.stack : '';
            this.logger.error(`Erro ao remover cliente: ${errorMessage}`, errorStack);
            throw error;
        }
    }
}