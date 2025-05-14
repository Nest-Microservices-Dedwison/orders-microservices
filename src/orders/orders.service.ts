import { HttpStatus, Inject, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
// import { PrismaClient } from './../../generated/prisma';
import { PrismaClient } from '@prisma/client';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { OrderPaginationDto } from './dto/order-pagination.dto';
import { ChangeOrderStatusDto } from './dto';
import { NATS_SERVICE } from 'src/config';
import { firstValueFrom } from 'rxjs';
import { access } from 'fs';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {

  constructor(
    @Inject(NATS_SERVICE) private readonly client: ClientProxy,    
  ) {
    super();
  }
  
  private readonly logger = new Logger('OrdersService')

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected');
  }

  

  async create(createOrderDto: CreateOrderDto) {
    
    try {
      // 1. confirmar los ids de los productos
      const productIds = createOrderDto.items.map( item => item.productId)

      const products: any[] = await firstValueFrom(
        this.client.send({ cmd: 'validate_products'}, productIds)
      );

      // 2. Cálculo de los valores
      const totalAmount = createOrderDto.items.reduce((acc, orderItem) => {

        const price = products.find(
          (product) => product.id === orderItem.productId).price;
        
        return (price * orderItem.quantity) + acc
      }, 0);

      const totalItems = createOrderDto.items.reduce((acc, orderItem) => {
        return acc + orderItem.quantity;
      }, 0);

      // 3. Crear una transacción de base de datos
      const order = await this.order.create({
        data: {
          totalAmount: totalAmount,
          totalItems: totalItems,
          OrderItem: {
            createMany: {
              data: createOrderDto.items.map( (orderItem) => ({
                price: products.find( product => product.id === orderItem.productId).price,
                productId: orderItem.productId,
                quantity: orderItem.quantity

              })),
            },
          },
        },
        include: {
          OrderItem: {
            select: {
              price: true,
              quantity: true,
              productId: true,
            }
          }
        }
      });
  
      return {
        ...order,
        OrderItem: order.OrderItem.map( (orderItem) => ({
          ...orderItem,
          name: products.find( (product) => product.id === orderItem.productId).name,
        }))
      };
    } catch (error) {
      throw new RpcException( error )
    }

   
  }

  async findAll(orderPaginationDto: OrderPaginationDto) {
    const totalOrders = await this.order.count({
      where: {
        status: orderPaginationDto.status
      }
    });

    const currentPage = orderPaginationDto.page;
    const perPage = orderPaginationDto.limit;

    return {
      data: await this.order.findMany({
        skip: (currentPage - 1) * perPage,
        take: perPage,
        where: {
          status: orderPaginationDto.status
        }        
      }),
      meta: {
        totalOrders: totalOrders,
        page: currentPage,
        lastPage: Math.ceil( totalOrders / perPage )
      }
    };
  }

  async findOne(id: string) {
    const order = await this.order.findFirst({
      where: { id },
      include: {
        OrderItem: {
          select: {
            price: true,
            quantity: true,
            productId: true
          },
        },
      }
    });

    if(!order){
      throw new RpcException({
        message: `Order with id #${ id } not found`,
        status: HttpStatus.NOT_FOUND 
      })
    };

    const productIds = order.OrderItem.map( orderItem => orderItem.productId );

    const products: any[] = await firstValueFrom(
      this.client.send({ cmd: 'validate_products'}, productIds)
    );

    return {
      ...order,
      OrderItem: order.OrderItem.map( orderItem => ({
        ...orderItem,
        name: products.find( product => product.id === orderItem.productId).name,
      }))
    };

    
  }

  async changeStatus(changeOrderStatusDto: ChangeOrderStatusDto) {
    const { id, status } = changeOrderStatusDto;

    const order = await this.findOne(id);

    if( order.status === status ){
      return order;
    }

    return this.order.update({
      where: { id },
      data: { status: status }
    });
  }
}
