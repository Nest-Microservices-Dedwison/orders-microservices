import { Controller, NotImplementedException, ParseUUIDPipe } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderPaginationDto } from './dto/order-pagination.dto';
import { ChangeOrderStatusDto, OrderItemDto, PaidOrderDto } from './dto';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern('createOrder')
  async create(@Payload() createOrderDto: CreateOrderDto) {
    const order: any = await this.ordersService.create(createOrderDto);
    const paymentSession = await this.ordersService.createSession(order );

    return {
      order,
      paymentSession
    }
  }
  

  @MessagePattern('findAllOrders')
  findAll( @Payload() orderPaginationDto: OrderPaginationDto ) {
    return this.ordersService.findAll(orderPaginationDto);
  }

  @MessagePattern('findOneOrder')
  async findOne(@Payload('id', ParseUUIDPipe) id: string) {
    return await this.ordersService.findOne(id);
  }

  @MessagePattern('changeOrderStatus')
  async changeOrderStatus(@Payload() changeOrderStatusDto: ChangeOrderStatusDto) {
    return await this.ordersService.changeStatus(changeOrderStatusDto);
  };

  @EventPattern('payment.succeeded')
  paidOrder(@Payload() paidOrderDto: PaidOrderDto){
    return this.ordersService.paidOrder(paidOrderDto);  
    
  }
}
