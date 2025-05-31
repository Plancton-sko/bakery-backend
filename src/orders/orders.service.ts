// src/orders/order.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Customer } from 'src/customer/entities/customer.entity';
import { Product } from 'src/products/product.entity';
import { CreateOrderDto } from './dtos/create-order.dto';
import { UpdateOrderDto } from './dtos/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) { }

  async create(createOrderDto: CreateOrderDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verificar ou criar cliente
      let customer = await this.customerRepository.findOne({
        where: { email: createOrderDto.customer.email }
      });

      if (!customer) {
        customer = this.customerRepository.create({
          firstName: createOrderDto.customer.firstName,
          lastName: createOrderDto.customer.lastName,
          email: createOrderDto.customer.email,
          address: createOrderDto.customer.address,
          phone: createOrderDto.customer.phone,
        });
        await queryRunner.manager.save(customer);
      }

      // Criar o pedido
      const order = new Order();
      order.customer = customer;
      order.status = OrderStatus.PENDING;
      order.notes = createOrderDto.notes;

      // Calcular o total do pedido
      let total = 0;
      const savedOrder = await queryRunner.manager.save(order);

      // Criar os itens do pedido
      for (const item of createOrderDto.items) {
        const product = await this.productRepository.findOne({
          where: { id: item.productId }
        });

        if (!product) {
          throw new NotFoundException(`Produto com ID ${item.productId} não encontrado`);
        }

        const orderItem = new OrderItem();
        orderItem.order = savedOrder;
        orderItem.product = product;
        orderItem.quantity = item.quantity;
        orderItem.price = item.price;
        orderItem.discount = item.discount || 0;

        await queryRunner.manager.save(orderItem);

        total += (item.price - item.discount) * item.quantity;
      }

      // Atualizar o total do pedido
      savedOrder.total = total;
      await queryRunner.manager.save(savedOrder);

      await queryRunner.commitTransaction();

      return this.findOne(savedOrder.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll() {
    return this.orderRepository.find({
      relations: ['customer', 'items', 'items.product'],
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: string) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['customer', 'items', 'items.product']
    });

    if (!order) {
      throw new NotFoundException(`Pedido com ID ${id} não encontrado`);
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto) {
    const order = await this.findOne(id);

    if (updateOrderDto.status) {
      order.status = updateOrderDto.status;
    }

    if (updateOrderDto.notes !== undefined) {
      order.notes = updateOrderDto.notes;
    }

    return this.orderRepository.save(order);
  }

  async remove(id: string) {
    const order = await this.findOne(id);
    await this.orderRepository.remove(order);
    return { deleted: true };
  }
}